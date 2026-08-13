<?php

namespace Workdo\Khalti\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\User;
use App\Models\Plan;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Workdo\Khalti\Events\KhaltiPaymentStatus;
use Workdo\Khalti\Services\KhaltiPaymentService;

class KhaltiController extends Controller
{
    public function planPayWithKhalti(Request $request)
    {
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
            'user_counter'   => -1,
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
                    return redirect()->route('plans.index')->with('error', __('Something went wrong, Please try again.'));
                }
            }

            try {
                $khaltiService = new KhaltiPaymentService(
                    admin_setting('khalti_secret_key'),
                    admin_setting('khalti_mode') === 'sandbox',
                    $admin_currancy
                );

                $response = $khaltiService->initiatePayment([
                    'return_url'           => route('khalti.plan.status'),
                    'amount'               => $price,
                    'purchase_order_id'    => $orderID,
                    'purchase_order_name'  => $plan->name ?? 'Basic Package',
                    'session'              => [
                        'plan_id'     => $plan->id,
                        'user_module' => $user_module,
                        'duration'    => $duration,
                        'coupon_code' => $request->coupon_code,
                        'user_id'     => $user->id,
                    ],
                ]);

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
                    $order->txn_id = $response['data']['pidx'] ?? null;
                    $order->payment_type = 'Khalti';
                    $order->payment_status = 'pending';
                    $order->created_by = $user->id;
                    $order->save();

                    return redirect()->away($response['data']['payment_url']);
                }

                throw new \Exception($response['data']['error'] ?? __('Khalti payment initiation failed'));
            } catch (\Exception $e) {
                return redirect()->route('plans.index')->with('error', $e->getMessage());
            }
        }

        return redirect()->route('plans.index')->with('error', __('The Plan has been deleted.'));
    }

    public function planGetKhaltiStatus(Request $request)
    {
        try {
            $pidx = $request->get('pidx');

            if ($request->status === 'Completed' && $pidx) {
                $khaltiService = new KhaltiPaymentService(
                    admin_setting('khalti_secret_key'),
                    admin_setting('khalti_mode') === 'sandbox'
                );

                $verification = $khaltiService->verifyPayment($pidx);
                $order = Order::where('txn_id', $pidx)->first();

                if ($verification['success']) {
                    if ($order) {
                        $order->payment_status = 'succeeded';
                        $order->save();
                    }

                    $planData = Session::get($pidx);
                    $plan = Plan::find($planData['plan_id']);
                    $counter = [
                        'user_counter'   => -1,
                        'storage_counter' => 0,
                    ];

                    $assignPlan = assignPlan($plan->id, $planData['duration'], $planData['user_module'], $counter, $planData['user_id']);

                    if ($assignPlan['is_success']) {
                        if ($planData['coupon_code']) {
                            $coupon = Coupon::where('code', $planData['coupon_code'])->first();
                            if ($coupon) {
                                recordCouponUsage($coupon->id, $planData['user_id'], $order->order_id);
                            }
                        }

                        try {
                            KhaltiPaymentStatus::dispatch($plan, 'Subscription', $order);
                        } catch (\Exception $e) {
                            \Illuminate\Support\Facades\Log::error('KhaltiPaymentStatus event error: ' . $e->getMessage());
                        }

                        return redirect()->route('plans.index')->with('success', __('Plan activated Successfully!'));
                    }

                    if ($order) {
                        $order->payment_status = 'failed';
                        $order->save();
                    }
                    return redirect()->route('plans.index')->with('error', __('Something went wrong, Please try again,'));
                }
            }

            if (isset($order)) {
                $order->payment_status = 'failed';
                $order->save();
            }
            return redirect()->route('plans.index')->with('error', __('Your Payment has failed!'));
        } catch (\Exception $exception) {
            return redirect()->route('plans.index')->with('error', $exception->getMessage());
        }
    }
}
