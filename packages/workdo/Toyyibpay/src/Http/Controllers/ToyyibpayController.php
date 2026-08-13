<?php

namespace Workdo\Toyyibpay\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\User;
use App\Models\Plan;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Workdo\Toyyibpay\Services\ToyyibpayService;
use Workdo\Toyyibpay\Events\ToyyibpayPaymentStatus;

class ToyyibpayController extends Controller
{
    public function planPayWithToyyibpay(Request $request)
    {
        try {
            $plan = Plan::find($request->plan_id);
            $user = User::find($request->user_id);

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
                    return redirect()->route('plans.index')->with('success', __('Plan activated Successfully.'));
                } else {
                    return redirect()->route('plans.index')->with('error', __('Something went wrong, Please try again,'));
                }
            }

            $toyyibpayService = new ToyyibpayService();

            $billData = [
                'billName' => "Plan: {$plan->name} - {$duration}",
                'billDescription' => "Payment for {$plan->name} plan",
                'billAmount' => $price,
                'billReturnUrl' => route('payment.toyyibpay.status'),
                'billCallbackUrl' => route('payment.toyyibpay.status'),
                'billTo' => $user->name,
                'billEmail' => $user->email,
                'billPhone' => $user->mobile_no ?? '',
                'session' => [
                    'plan_id' => $plan->id,
                    'duration' => $duration,
                    'user_module' => $user_module,
                    'user_id' => $request->user_id,
                    'counter' => $counter,
                    'coupon_code' => $request->coupon_code
                ],
            ];

            $response = $toyyibpayService->createBill($billData);

            if (isset($response['BillCode']) && isset($response['url'])) {
                $order                 = new Order();
                $order->order_id       = $response['orderID'] ?? null;
                $order->name           = $user->name ?: '';
                $order->email          = $user->email ?: '';
                $order->plan_name      = !empty($plan->name) ? $plan->name : 'Basic Package';
                $order->plan_id        = $plan->id;
                $order->price          = !empty($price) ? $price : 0;
                $order->currency       = $toyyibpayService->currency;
                $order->txn_id         = $response['BillCode'] ?? null;
                $order->payment_type   = 'Toyyibpay';
                $order->payment_status = 'pending';
                $order->created_by     = $user->id;
                $order->save();

                return redirect($response['url']);
            }

            return redirect()->route('plans.index')->with('error', __('Payment initialization failed.'));
        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', $e->getMessage());
        }
    }

    public function planGetToyyibpayStatus(Request $request)
    {
        try {
            $toyyibpayService = new ToyyibpayService();
            if ($toyyibpayService->verifyPayment($request)) {

                $order = Order::where('order_id', $request->order_id)->first();
                $plan = Plan::find($request->plan_id);
                if ($order && $plan) {
                    $order->payment_status = 'succeeded';
                    $order->txn_id         = $request->billcode ?? null;
                    $order->save();

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
                            ToyyibpayPaymentStatus::dispatch($plan, $type, $order);
                        } catch (\Exception $e) {
                        }

                        return redirect()->route('plans.index')->with('success', __('Plan activated Successfully!'));
                    } else {
                        $order->payment_status = 'failed';
                        $order->save();
                        return redirect()->route('plans.index')->with('error', __('Plan activation failed.'));
                    }
                }
            } else {
                $order = Order::where('order_id', $request->order_id)->first();
                if ($order) {
                    $order->payment_status = 'failed';
                    $order->save();
                }
                return redirect()->route('plans.index')->with('error', __('Payment Initiation Failed, Please try again.'));
            }
        } catch (\Exception $exception) {
            return redirect()->route('plans.index')->with('error', $exception->getMessage());
        }
    }
}
