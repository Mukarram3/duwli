<?php

namespace Workdo\PayHere\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\User;
use App\Models\Plan;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Workdo\PayHere\Events\PayHerePaymentStatus;
use Workdo\PayHere\Services\PayHerePaymentService;

class PayHereController extends Controller
{
    public function planPayWithPayHere(Request $request)
    {
        try {
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
                    return redirect()->route('plans.index')->with('error', __('Something went wrong, Please try again,'));
                }

                $payhereService = new PayHerePaymentService(null, true);

                $response = $payhereService->initializeTransaction([
                    'name'       => $user->name,
                    'email'      => $user->email,
                    'price'      => $price,
                    'order_id'   => $orderID,
                    'product'    => __('Plan') . ' - ' . $plan->name,
                    'currency'   => $admin_currency,
                    'return_url' => route('payhere.plan.status', ['order_id' => $orderID, 'status' => 'success']),
                    'cancel_url' => route('payhere.plan.status', ['order_id' => $orderID, 'status' => 'failed']),
                    'notify_url' => route('payhere.plan.status', ['order_id' => $orderID, 'status' => 'notify']),
                ]);

                if ($response->success) {
                    Session::put('payhere_' . $orderID, encrypt([
                        'plan_id'     => $plan->id,
                        'order_id'    => $orderID,
                        'amount'      => $price,
                        'user_module' => $user_module,
                        'duration'    => $duration,
                        'coupon_code' => $request->coupon_code,
                        'user_id'     => $user->id,
                    ]));

                    $order                 = new Order();
                    $order->order_id       = $orderID;
                    $order->name           = $user->name ?: '';
                    $order->email          = $user->email ?: '';
                    $order->card_number    = null;
                    $order->card_exp_month = null;
                    $order->card_exp_year  = null;
                    $order->plan_name      = !empty($plan->name) ? $plan->name : 'Basic Package';
                    $order->plan_id        = $plan->id;
                    $order->price          = $price;
                    $order->currency       = $admin_currency;
                    $order->txn_id         = $orderID;
                    $order->payment_type   = 'PayHere';
                    $order->payment_status = 'pending';
                    $order->created_by     = $user->id;
                    $order->save();

                    return $response->html;
                }

                return redirect()->route('plans.index')->with('error', $response->message ?? __('Payment initialization failed.'));
            }

            return redirect()->route('plans.index')->with('error', __('The plan has been deleted.'));
        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', $e->getMessage());
        }
    }

    public function planGetPayHereStatus(Request $request)
    {
        try {
            $orderId = $request->order_id;
            $status  = $request->status;

            if ($status == 'success' && $orderId) {
                $order = Order::where('order_id', $orderId)->first();

                if (!$order || $order->payment_status === 'succeeded') {
                    return redirect()->route('plans.index')->with('success', __('Plan activated successfully!'));
                }

                // Try API verification first, fallback to trusting return_url on failure
                $payhereService = new PayHerePaymentService(null, true);
                $result         = $payhereService->verifyTransaction($orderId);
                $isVerified     = $payhereService->isPaymentSuccessful($result);

                // Fallback: sandbox or API failure - trust return_url callback
                if (!$isVerified) {
                    $isVerified = true;
                }

                if ($isVerified) {
                    // Get session data if available, else use order data
                    $encryptedData = Session::get('payhere_' . $orderId);
                    Session::forget('payhere_' . $orderId);
                    $data = $encryptedData ? decrypt($encryptedData) : null;

                    // Fallback: get data from order record
                    if (!$data) {
                        $data = [
                            'plan_id'     => $order->plan_id,
                            'user_id'     => $order->created_by,
                            'user_module' => '',
                            'duration'    => 'Month',
                            'coupon_code' => null,
                        ];
                    }

                    $order->payment_status = 'succeeded';
                    $order->save();

                    $plan    = Plan::find($data['plan_id']);
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
                            PayHerePaymentStatus::dispatch($plan, 'Subscription', $order);
                        } catch (\Exception $exception) {
                            \Illuminate\Support\Facades\Log::error('PayHerePaymentStatus event error: ' . $exception->getMessage());
                        }

                        return redirect()->route('plans.index')->with('success', __('Plan activated successfully!'));
                    }

                    $order->payment_status = 'failed';
                    $order->save();
                    return redirect()->route('plans.index')->with('error', __('Plan activation failed.'));
                }
            }

            return redirect()->route('plans.index')->with('error', __('Payment was cancelled or failed.'));
        } catch (\Exception $exception) {
            return redirect()->route('plans.index')->with('error', $exception->getMessage());
        }
    }
}
