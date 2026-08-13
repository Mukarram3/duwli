<?php

namespace Workdo\PaiementPro\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Plan;
use App\Models\User;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use Workdo\PaiementPro\Services\PaiementProPaymentService;
use Workdo\PaiementPro\Events\PaiementProPaymentStatus;

class PaiementProController extends Controller
{
    public function validateRequest(Request $request)
    {
        $request->validate([
            'mobile_number' => 'required|numeric',
            'channel' => 'required|string|in:CARD,MOMO,OMCIV2,FLOOZ,PAYPAL',
        ]);

        $validator = Validator::make(
            $request->only('mobile_number', 'channel'),
            [
                'mobile_number' => 'required|numeric',
                'channel' => 'required|in:CARD,MOMO,OMCIV2,FLOOZ,PAYPAL',
            ]
        );

        if ($validator->fails()) {
            return throw new \Exception($validator->errors()->first());
        }
    }

    public function planPayWithPaiementPro(Request $request)
    {
        try {
            $this->validateRequest($request);

            $plan = Plan::find($request->plan_id);
            $user = User::find($request->user_id);

            if ($plan && $user) {
                $admin_settings = getAdminAllSetting();
                $admin_currency = !empty($admin_settings['defaultCurrency']) ? $admin_settings['defaultCurrency'] : '';

                $user_module = !empty($request->user_module_input) ? $request->user_module_input : '';
                $duration    = !empty($request->time_period) ? $request->time_period : 'Month';

                $user_module_price = 0;
                if (!empty($user_module)) {
                    $user_module_array = explode(',', $user_module);
                    foreach ($user_module_array as $value) {
                        $temp = ($duration == 'Year') ? ModulePriceByName($value)['yearly_price'] : ModulePriceByName($value)['monthly_price'];
                        $user_module_price += $temp;
                    }
                }

                $plan_price = ($duration == 'Year') ? $plan->package_price_yearly : $plan->package_price_monthly;
                $counter    = [
                    'user_counter'   => -1,
                    'storage_counter' => 0,
                ];

                $orderID = strtoupper(str_replace('.', '', uniqid('', true)));
                $price   = $plan_price + $user_module_price;

                if ($request->coupon_code) {
                    $validation = applyCouponDiscount($request->coupon_code, $price, auth()->id());
                    if ($validation['valid']) {
                        $price = $validation['final_amount'];
                    }
                }

                if ($price <= 0) {
                    $assignPlan = assignPlan($plan->id, $duration, $user_module, $counter, $request->user_id);
                    if ($assignPlan['is_success']) {
                        return redirect()->route('plans.index')->with('success', __('Plan activated successfully!'));
                    }
                    return redirect()->route('plans.index')->with('error', __('Something went wrong, please try again.'));
                }

                $paiementproService = new PaiementProPaymentService(null, true);

                $response = $paiementproService->initializeTransaction([
                    'name'     => $user->name,
                    'email'    => $user->email,
                    'url'      => route('payment.paiementpro.status', ['plan_id' => $plan->id, 'order_id' => $orderID]),
                    'price'    => $price,
                    'order_id' => $orderID,
                    'product'  => __('Plan') . ' - ' . $plan->name,
                    'currency' => $admin_currency,
                    'channel'  => $request->channel ?? 'CARD',
                    'phone'    => $request->mobile_number ?? '',
                ]);

                if ($response->success) {
                    Session::put('paiementpro_' . $orderID, encrypt([
                        'plan_id'         => $plan->id,
                        'order_id'        => $orderID,
                        'amount'          => $price,
                        'user_module'     => $user_module,
                        'duration'        => $duration,
                        'coupon_code'     => $request->coupon_code,
                        'user_id'         => $user->id,
                        'currency'        => $admin_currency,
                        'payment_link_id' => $response->payment_link_id,
                    ]));

                    $order                 = new Order();
                    $order->order_id       = $orderID;
                    $order->name           = $user->name ?? '';
                    $order->email          = $user->email ?? '';
                    $order->card_number    = null;
                    $order->card_exp_month = null;
                    $order->card_exp_year  = null;
                    $order->plan_name      = !empty($plan->name) ? $plan->name : 'Basic Package';
                    $order->plan_id        = $plan->id;
                    $order->price          = !empty($price) ? $price : 0;
                    $order->currency       = $admin_currency;
                    $order->txn_id         = $response->payment_link_id;
                    $order->payment_type   = 'PaiementPro';
                    $order->payment_status = 'pending';
                    $order->created_by     = $user->id;
                    $order->save();

                    return redirect($response->url);
                }

                return redirect()->route('plans.index')->with('error', $response->message ?? __('Payment initialization failed.'));
            }

            return redirect()->route('plans.index')->with('error', __('The plan has been deleted.'));
        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', $e->getMessage());
        }
    }

    public function planGetPaiementProStatus(Request $request, $plan_id)
    {
        try {
            $orderId = $request->input('order_id');

            if ($orderId && !empty($request->responsecode) && $request->responsecode == 0) {
                $encryptedData = Session::get('paiementpro_' . $orderId);
                Session::forget('paiementpro_' . $orderId);

                $order = Order::where('order_id', $orderId)->first();

                if ($encryptedData) {
                    $data          = decrypt($encryptedData);
                    $paymentLinkId = $data['payment_link_id'] ?? null;

                    if ($paymentLinkId && $data) {
                        $paiementproService = new PaiementProPaymentService(null, true);

                        if ($paiementproService->isPaymentSuccessful($request)) {
                            if ($order) {
                                $order->payment_status = 'succeeded';
                                $order->save();
                            }

                            $plan    = Plan::find($plan_id);
                            $counter = [
                                'user_counter'   => -1,
                                'storage_counter' => 0,
                            ];

                            $assignPlan = assignPlan($plan->id, $data['duration'], $data['user_module'], $counter, $data['user_id']);

                            if ($assignPlan['is_success']) {
                                if (!empty($data['coupon_code'])) {
                                    $coupon = Coupon::where('code', $data['coupon_code'])->first();
                                    if ($coupon) {
                                        recordCouponUsage($coupon->id, $data['user_id'], $orderId);
                                    }
                                }


                                try {
                                    PaiementProPaymentStatus::dispatch($plan, 'Subscription', $order);
                                } catch (\Exception $exception) {
                                }

                                return redirect()->route('plans.index')->with('success', __('Plan activated successfully!'));
                            }

                            if ($order) {
                                $order->payment_status = 'failed';
                                $order->save();
                            }
                            return redirect()->route('plans.index')->with('error', __('Something went wrong, please try again.'));
                        }
                    }
                }

                if ($order) {
                    $order->payment_status = 'failed';
                    $order->save();
                }
            }

            return redirect()->route('plans.index')->with('error', __('Payment was cancelled or failed.'));
        } catch (\Exception $exception) {
            return redirect()->route('plans.index')->with('error', $exception->getMessage());
        }
    }
}
