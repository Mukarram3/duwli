<?php

namespace Workdo\Mollie\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\User;
use App\Models\Plan;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Workdo\Mollie\Services\MolliePaymentService;
use Workdo\Mollie\Events\MolliePaymentStatus;

class MollieController extends Controller
{
    public function planPayWithMollie(Request $request)
    {
        try {
            $plan = Plan::find($request->plan_id);
            $user = User::find($request->user_id);
            $admin_settings = getAdminAllSetting();
            $admin_currency = !empty($admin_settings['defaultCurrency']) ? $admin_settings['defaultCurrency'] : '';

            if (!$plan) {
                return redirect()->route('plans.index')->with('error', __('The plan has been deleted.'));
            }

            $user_module = !empty($request->user_module_input) ? $request->user_module_input : '';
            $duration = !empty($request->time_period) ? $request->time_period : 'Month';

            $user_module_price = 0;
            if (!empty($user_module) && $plan->custom_plan == 1) {
                $user_module_array = explode(',', $user_module);
                foreach ($user_module_array as $value) {
                    $temp = ($duration == 'Year') ? ModulePriceByName($value)['yearly_price'] : ModulePriceByName($value)['monthly_price'];
                    $user_module_price += $temp;
                }
            }

            $plan_price = ($duration == 'Year') ? $plan->package_price_yearly : $plan->package_price_monthly;
            $counter = [
                'user_counter' => -1,
                'storage_limit' => 0,
            ];

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
                    return redirect()->route('plans.index')->with('success', __('Plan activated Successfully!'));
                } else {
                    return redirect()->route('plans.index')->with('error', __('Something went wrong, Please try again,'));
                }
            }

            $mollieService = new MolliePaymentService();

            $paymentData = [
                'amount' => $price,
                'description' => "{$plan->name} - {$duration}",
                'redirectUrl' => route('payment.mollie.status', [
                    'order_id' => $mollieService->orderId,
                ]),
                'session' => [
                    'plan_id' => $plan->id,
                    'duration' => $duration,
                    'user_module' => $user_module,
                    'user_id' => $request->user_id,
                    'counter' => $counter,
                    'coupon_code' => $request->coupon_code
                ]
            ];

            $response = $mollieService->createPayment($paymentData);

            $order = new Order();
            $order->order_id = $mollieService->orderId;
            $order->name = null;
            $order->email = null;
            $order->plan_name = !empty($plan->name) ? $plan->name : 'Basic Package';
            $order->plan_id = $plan->id;
            $order->price = $price;
            $order->currency = $admin_currency;
            $order->txn_id = $response['payment_id'] ?: null;
            $order->payment_type = 'Mollie';
            $order->payment_status = 'pending';
            $order->created_by = $user->id;
            $order->save();

            if (isset($response['checkout_url'])) {
                return redirect()->away($response['checkout_url']);
            }

            return redirect()->route('plans.index')->with('error', __('Payment initialization failed.'));
        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', $e->getMessage());
        }
    }

    public function planGetMollieStatus(Request $request)
    {
        try {
            $mollieService = new MolliePaymentService();

            $Order = Order::where('order_id', $request->order_id)->first();
            if ($mollieService->isPaymentPaid($request)) {
                $plan = Plan::find($request->plan_id);
                $counter = [
                    'user_counter' => $request->counter['user_counter'] ?? 0,
                    'storage_limit' => $request->counter['storage_limit'] ?? 0,
                ];

                $assignPlan = assignPlan($plan->id, $request->duration, $request->user_module, $counter, $request->user_id);

                if ($assignPlan['is_success']) {
                    if ($request->coupon_code) {
                        $coupon = Coupon::where('code', $request->coupon_code)->first();
                        if ($coupon) {
                            recordCouponUsage($coupon->id, $request->user_id, $request->order_id);
                        }
                    }

                    $type = 'Subscription';
                    try {
                        MolliePaymentStatus::dispatch($plan, $type, $Order);
                    } catch (\Exception $e) {
                    }

                    $Order->payment_status = 'succeeded';
                    $Order->save();
                    return redirect()->route('plans.index')->with('success', __('Plan activated Successfully!'));
                }
            }

            $Order->payment_status = 'failed';
            $Order->save();
            return redirect()->route('plans.index')->with('error', __('Your Payment has failed!'));
        } catch (\Exception $exception) {
            return redirect()->route('plans.index')->with('error', $exception->getMessage());
        }
    }
}
