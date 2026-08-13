<?php

namespace Workdo\Mercado\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Plan;
use App\Models\Order;
use App\Models\Coupon;
use Workdo\Mercado\Events\MercadoPaymentStatus;
use Workdo\Mercado\Services\MercadoService;

class MercadoController extends Controller
{
    public function planPayWithMercado(Request $request)
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
                    return redirect()->route('plans.index')->with('error', __('Something went wrong, please try again.'));
                }

                $mercadoService = new MercadoService(null, true);

                $result = $mercadoService->createPreference([
                    'title' => $plan->name ?? __('Subscription'),
                    'price' => $price,
                    'url'   => route('mercado.plan.status', [
                        'plan_id'     => $plan->id,
                        'user_id'     => $user->id,
                        'order_id'    => $orderID,
                        'amount'      => $price,
                        'user_module' => $user_module,
                        'duration'    => $duration,
                        'coupon_code' => $request->coupon_code,
                    ]),
                ]);

                if ($result['success']) {
                    $order                 = new Order();
                    $order->order_id       = $orderID;
                    $order->name           = $user->name ?: '';
                    $order->email          = $user->email ?: '';
                    $order->plan_name      = !empty($plan->name) ? $plan->name : 'Basic Package';
                    $order->plan_id        = $plan->id;
                    $order->price          = !empty($price) ? $price : 0;
                    $order->currency       = $admin_currency;
                    $order->txn_id         = $result['preference_id'] ?? null;
                    $order->payment_type   = 'Mercado';
                    $order->payment_status = 'pending';
                    $order->created_by     = $user->id;
                    $order->save();

                    return redirect($result['init_point']);
                }
            }

            return redirect()->route('plans.index')->with('error', __('The plan has been deleted.'));
        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', $e->getMessage());
        }
    }

    public function planGetMercadoStatus(Request $request)
    {
        try {
            if (cache()->has($request->get('order_id', ''))) {
                return redirect()->route('plans.index')->with('success', __('Plan activated successfully!'));
            }

            $order = Order::where('order_id', $request->order_id)->first();

            if ($request->status == 'approved') {
                $mercadoService = new MercadoService(null, true);

                if ($mercadoService->isPaymentApproved($request->payment_id)) {
                    if ($order) {
                        $order->payment_status = 'succeeded';
                        $order->txn_id         = $request->transaction_id;
                        $order->save();
                    }

                    $plan    = Plan::find($request->plan_id);
                    $counter = [
                        'user_counter'   => -1,
                        'storage_counter' => 0,
                    ];

                    $assignPlan = assignPlan($plan->id, $request->duration, $request->user_module, $counter, $request->user_id);

                    if ($assignPlan['is_success']) {
                        if (!empty($request->coupon_code)) {
                            $coupon = Coupon::where('code', $request->coupon_code)->first();
                            if ($coupon) {
                                recordCouponUsage($coupon->id, $request->user_id, $request->order_id);
                            }
                        }

                        try {
                            MercadoPaymentStatus::dispatch($plan, 'Subscription', $order);
                        } catch (\Exception $exception) {
                        }

                        return redirect()->route('plans.index')->with('success', __('Plan activated successfully!'));
                    }

                    if ($order) {
                        $order->payment_status = 'failed';
                        $order->save();
                    }
                    return redirect()->route('plans.index')->with('error', __('Plan activation failed.'));
                }
            }

            if ($order) {
                $order->payment_status = 'failed';
                $order->save();
            }
            return redirect()->route('plans.index')->with('error', __('Payment was cancelled or failed.'));
        } catch (\Exception $exception) {
            return redirect()->route('plans.index')->with('error', $exception->getMessage());
        }
    }
}
