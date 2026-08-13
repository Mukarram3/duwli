<?php

namespace Workdo\Easebuzz\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\User;
use App\Models\Plan;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Workdo\Easebuzz\Events\EasebuzzPaymentStatus;
use Workdo\Easebuzz\Services\EasebuzzService;

class EasebuzzController extends Controller
{
    public function planPayWithEasebuzz(Request $request)
    {
        if (!$request->has('easebuzz_mobile') || empty($request->easebuzz_mobile)) {
            return redirect()->back()->with('error', __('Mobile number is required for Easebuzz payment.'));
        }

        $plan = Plan::find($request->plan_id);
        $user = User::find($request->user_id);
        $admin_settings = getAdminAllSetting();
        $admin_currancy = !empty($admin_settings['defaultCurrency']) ? $admin_settings['defaultCurrency'] : '';

        $user_module = !empty($request->user_module_input) ? $request->user_module_input : '';
        $duration = !empty($request->time_period) ? $request->time_period : 'Month';
        $user_module_price = 0;

        if (!empty($user_module)) {
            $user_module_array = explode(',', $user_module);
            foreach ($user_module_array as $key => $value) {
                $temp = ($duration == 'Year') ? ModulePriceByName($value)['yearly_price'] : ModulePriceByName($value)['monthly_price'];
                $user_module_price = $user_module_price + $temp;
            }
        }

        $plan_price = ($duration == 'Year') ? $plan->package_price_yearly : $plan->package_price_monthly;
        $counter = [
            'user_counter' => -1,
            'storage_counter' => 0,
        ];

        $orderID = strtoupper(substr(uniqid(), -12));

        if ($plan) {
            $plan->discounted_price = false;
            $price = $plan_price + $user_module_price;

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
                } else {
                    return redirect()->route('plans.index')->with('error', __('Something went wrong, Please try again,'));
                }
            }

            try {
                $easebuzz_merchant_key = admin_setting('easebuzz_merchant_key');
                $easebuzz_salt_key = admin_setting('easebuzz_salt_key');
                $easebuzz_mode = admin_setting('easebuzz_mode');

                $easebuzzService = new EasebuzzService($easebuzz_merchant_key, $easebuzz_salt_key, $easebuzz_mode);

                $transaction_id = strtoupper(str_replace('.', '', uniqid('', true)));
                $price = number_format((float)$price, 2, '.', '');

                $postData = [
                    "txnid"      => $transaction_id,
                    "amount"     => $price,
                    "firstname"  => $user->name,
                    "email"      => $user->email,
                    "phone"      => $request->easebuzz_mobile,
                    "productinfo" => $plan->name ?? 'Usage Subscription',
                    "surl"       => route('easebuzz.plan.status', ['status' => 'success', 'order_id' => $orderID]),
                    "furl"       => route('easebuzz.plan.status', ['status' => 'failed']),
                    "udf1" => '', "udf2" => '', "udf3" => '', "udf4" => '', "udf5" => '',
                    "address1" => '', "address2" => '', "city" => '', "state" => '', "country" => '', "zipcode" => '',
                ];

                $response = $easebuzzService->initiatePayment($postData);

                if ($response['success']) {
                    $order = new Order();
                    $order->order_id = $orderID;
                    $order->name = $user->name ?? '';
                    $order->email = $user->email ?? '';
                    $order->card_number = null;
                    $order->card_exp_month = null;
                    $order->card_exp_year = null;
                    $order->plan_name = !empty($plan->name) ? $plan->name : 'Basic Package';
                    $order->plan_id = $plan->id;
                    $order->price = !empty($price) ? $price : 0;
                    $order->currency = $admin_currancy;
                    $order->txn_id = $transaction_id;
                    $order->payment_type = 'Easebuzz';
                    $order->payment_status = 'pending';
                    $order->receipt = null;
                    $order->created_by = $user->id;
                    $order->save();

                    Session::put($orderID, [
                        'plan_id'        => $plan->id,
                        'duration'       => $duration,
                        'user_module'    => $user_module,
                        'coupon_code'    => $request->coupon_code,
                        'user_id'        => $user->id,
                        'transaction_id' => $transaction_id,
                    ]);

                    return redirect()->away($response['payment_url']);
                }

                throw new \Exception($response['error'] ?? __('Easebuzz payment initiation failed'));
            } catch (\Exception $e) {
                return redirect()->route('plans.index')->with('error', $e->getMessage());
            }
        }

        return redirect()->route('plans.index')->with('error', __('The Plan has been deleted.'));
    }

    public function planGetEasebuzzStatus(Request $request)
    {
        try {
            $orderId = $request->input('order_id') ?? $request->query('order_id');

            if (!$orderId) {
                return redirect()->route('plans.index')->with('error', __('Invalid order ID.'));
            }

            $orderData = Session::get($orderId);
            Session::forget($orderId);

            $order = Order::where('order_id', $orderId)->first();

            if ($order && $request->input('status') === 'success' && $orderData) {
                $easebuzz_merchant_key = admin_setting('easebuzz_merchant_key');
                $easebuzz_salt_key = admin_setting('easebuzz_salt_key');
                $easebuzz_mode = admin_setting('easebuzz_mode');

                $easebuzzService = new EasebuzzService($easebuzz_merchant_key, $easebuzz_salt_key, $easebuzz_mode);
                $payment_status = $easebuzzService->verifyPayment($request->all());

                if ($payment_status['success']) {
                    $order->payment_status = 'succeeded';
                    $order->save();

                    $plan = Plan::find($orderData['plan_id']);
                    $counter = [
                        'user_counter'   => -1,
                        'storage_counter' => 0,
                    ];

                    $assignPlan = assignPlan($plan->id, $orderData['duration'], $orderData['user_module'], $counter, $orderData['user_id']);

                    if ($assignPlan['is_success']) {
                        if ($orderData['coupon_code']) {
                            $coupon = Coupon::where('code', $orderData['coupon_code'])->first();
                            if ($coupon) {
                                recordCouponUsage($coupon->id, $orderData['user_id'], $order->order_id);
                            }
                        }

                        try {
                            EasebuzzPaymentStatus::dispatch($plan, 'Subscription', $order);
                        } catch (\Exception $e) {
                        }

                        return redirect()->route('plans.index')->with('success', __('Plan activated successfully!'));
                    }

                    $order->payment_status = 'failed';
                    $order->save();
                    return redirect()->route('plans.index')->with('error', __('Something went wrong, Please try again,'));
                }
            }

            if ($order) {
                $order->payment_status = 'failed';
                $order->save();
            }

            return redirect()->route('plans.index')->with('error', __('Your Payment has failed!'));
        } catch (\Exception $exception) {
            return redirect()->route('plans.index')->with('error', $exception->getMessage());
        }
    }
}
