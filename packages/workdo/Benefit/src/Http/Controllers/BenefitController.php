<?php

namespace Workdo\Benefit\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\User;
use App\Models\Plan;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Workdo\Benefit\Services\BenefitService;
use Workdo\Benefit\Events\BenefitPaymentStatus;

class BenefitController extends Controller
{
    public function planPayWithBenefit(Request $request)
    {
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

        $orderID = strtoupper(substr(uniqid(), -12));
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
                return redirect()->route('plans.index')->with('success', __('The plan has been activated successfully.'));
            }
            return redirect()->route('plans.index')->with('error', __('Something went wrong, Please try again,'));
        }

        try {
            $benefitService = new BenefitService([
                'api_key'                => $admin_settings['benefit_api_key'] ?? '',
                'secret_key'             => $admin_settings['benefit_secret_key'] ?? '',
                'processing_channel_id'  => $admin_settings['benefit_processing_channel_id'] ?? '',
            ]);

            $response = $benefitService->createPaymentLink([
                'name'     => "Plan: {$plan->name} - {$duration}",
                'amount'   => $price,
                'currency' => $admin_currency,
                'customer' => ['name' => $user->name, 'email' => $user->email],
                'billing'  => ['country' => 'BH'],
            ], [
                'redirect_url' => route('payment.benefit.status', [
                    'order_id'    => $orderID,
                    'return_type' => 'success',
                ]),
            ]);

            Session::put($orderID, [
                'plan_id'     => $plan->id,
                'duration'    => $duration,
                'user_module' => $user_module,
                'user_id'     => $request->user_id,
                'coupon_code' => $request->coupon_code,
            ]);

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
            $order->txn_id         = $response['id'] ?? null;
            $order->payment_type   = 'Benefit';
            $order->payment_status = 'pending';
            $order->receipt        = null;
            $order->created_by     = $user->id;
            $order->save();

            if (isset($response['_links']['redirect']['href'])) {
                return redirect($response['_links']['redirect']['href']);
            }

            return redirect()->route('plans.index')->with('error', __('Payment initialization failed.'));
        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', $e->getMessage());
        }
    }

    public function planGetBenefitStatus(Request $request)
    {
        try {
            $Order     = Order::where('order_id', $request->order_id)->first();
            $sessionData = Session::get($request->order_id);
            Session::forget($request->order_id);

            if ($sessionData) {
                $request->merge($sessionData);
            }

            $paymentLinkId = $Order->txn_id ?? null;

            if ($request->return_type == 'success' && $paymentLinkId) {
                $admin_settings = getAdminAllSetting();
                $benefitService = new BenefitService([
                    'api_key'               => $admin_settings['benefit_api_key'] ?? '',
                    'secret_key'            => $admin_settings['benefit_secret_key'] ?? '',
                    'processing_channel_id' => $admin_settings['benefit_processing_channel_id'] ?? '',
                ]);

                $paymentLink = $benefitService->retrievePaymentLink($paymentLinkId);

                if ($paymentLink && isset($paymentLink['status']) && $paymentLink['status'] === 'Payment Received') {
                    $Order->payment_status = 'succeeded';
                    $Order->save();

                    $plan    = Plan::find($request->plan_id ?? $Order->plan_id);
                    $counter = [
                        'user_counter'   => -1,
                        'storage_counter' => 0,
                    ];

                    $userId     = $request->user_id ?? $Order->created_by;
                    $duration   = $request->duration ?? 'Month';
                    $userModule = $request->user_module ?? '';

                    $assignPlan = assignPlan($plan->id, $duration, $userModule, $counter, $userId);

                    if ($assignPlan['is_success']) {
                        if ($request->coupon_code) {
                            $coupon = Coupon::where('code', $request->coupon_code)->first();
                            if ($coupon) {
                                recordCouponUsage($coupon->id, $userId, $request->order_id);
                            }
                        }

                        try {
                            BenefitPaymentStatus::dispatch($plan, 'Subscription', $Order);
                        } catch (\Exception $e) {
                        }

                        return redirect()->route('plans.index')->with('success', __('The plan has been activated successfully.'));
                    }

                    $Order->payment_status = 'failed';
                    $Order->save();
                    return redirect()->route('plans.index')->with('error', __('Something went wrong, Please try again,'));
                }
            }

            return redirect()->route('plans.index')->with('error', __('Your Payment has failed!'));
        } catch (\Exception $exception) {
            return redirect()->route('plans.index')->with('error', $exception->getMessage());
        }
    }
}
