<?php

namespace Workdo\Ozow\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\User;
use App\Models\Plan;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Workdo\Ozow\Events\OzowPaymentStatus;
use Workdo\Ozow\Services\OzowService;

class OzowController extends Controller
{
    public function planPayWithOzow(Request $request)
    {
        $plan = Plan::find($request->plan_id);
        $user = User::find($request->user_id);
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

        if ($plan) {
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
                    return redirect()->route('plans.index')->with('error', __('Something went wrong. Please try again.'));
                }
            }

            try {
                $ozowService = new OzowService(null, true);

                $sessionData = [
                    'plan_id'     => $plan->id,
                    'duration'    => $duration,
                    'user_module' => $user_module,
                    'coupon_code' => $request->coupon_code,
                    'user_id'     => $user->id,
                ];

                $response = $ozowService->createPayment(
                    $price,
                    route('ozow.plan.status', ['status' => 'success', 'order_id' => $orderID]),
                    route('ozow.plan.status', ['status' => 'failed']),
                    route('ozow.plan.status', ['status' => 'cancel']),
                    $orderID,
                    $sessionData
                );

                if ($response['success']) {
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
                    $order->txn_id         = $response['transaction_reference'] ?? null;
                    $order->payment_type   = 'Ozow';
                    $order->payment_status = 'pending';
                    $order->receipt        = null;
                    $order->created_by     = $user->id;
                    $order->save();

                    return redirect()->away($response['payment_url']);
                }

                return redirect()->route('plans.index')->with('error', $response['error'] ?? __('Ozow checkout failed'));
            } catch (\Exception $exception) {
                return redirect()->route('plans.index')->with('error', $exception->getMessage());
            }
        }

        return redirect()->route('plans.index')->with('error', __('The Plan has been deleted.'));
    }

    public function planGetOzowStatus(Request $request)
    {
        try {
            $ozowService = new OzowService(null, true);
            $planData    = Session::get($request->order_id);
            Session::forget($request->order_id);

            $order = Order::where('order_id', $request->order_id)->first();

            if ($planData && $ozowService->isPaymentSuccessful($request)) {
                if ($order) {
                    $order->payment_status = 'succeeded';
                    $order->save();
                }

                $plan    = Plan::find($planData['plan_id']);
                $counter = [
                    'user_counter'   => -1,
                    'storage_counter' => 0,
                ];

                $assignPlan = assignPlan($plan->id, $planData['duration'], $planData['user_module'], $counter, $planData['user_id']);

                if ($assignPlan['is_success']) {
                    if ($planData['coupon_code']) {
                        $coupon = Coupon::where('code', $planData['coupon_code'])->first();
                        if ($coupon) {
                            recordCouponUsage($coupon->id, $planData['user_id'], $request->order_id);
                        }
                    }

                    try {
                        OzowPaymentStatus::dispatch($plan, 'Subscription', $order);
                    } catch (\Exception $e) {
                    }

                    return redirect()->route('plans.index')->with('success', __('Plan activated successfully!'));
                }

                if ($order) {
                    $order->payment_status = 'failed';
                    $order->save();
                }
                return redirect()->route('plans.index')->with('error', __('Something went wrong. Please try again.'));
            }

            if ($order) {
                $order->payment_status = 'failed';
                $order->save();
            }
            return redirect()->route('plans.index')->with('error', __('Transaction has been failed.'));
        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', $e->getMessage());
        }
    }
}
