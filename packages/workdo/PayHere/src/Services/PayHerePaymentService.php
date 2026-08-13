<?php

namespace Workdo\PayHere\Services;

use Illuminate\Support\Facades\Http;

class PayHerePaymentService
{
    protected $merchantId;
    protected $merchantSecret;
    protected $appId;
    protected $appSecret;
    protected $mode;
    protected $baseUrl;

    public function __construct($userId = null, $isPlan = false)
    {
        $setting = $isPlan ? getAdminAllSetting() : getCompanyAllSetting($userId);

        $this->merchantId = $setting['payhere_merchant_id'] ?? '';
        $this->merchantSecret = $setting['payhere_merchant_secret'] ?? '';
        $this->appId = $setting['payhere_app_id'] ?? '';
        $this->appSecret = $setting['payhere_app_secret'] ?? '';
        $this->mode = $setting['payhere_mode'] ?? 'sandbox';
        $this->baseUrl = ($this->mode == 'live') ? 'https://www.payhere.lk' : 'https://sandbox.payhere.lk';
    }

    public function initializeTransaction($data)
    {
        try {
            $amount = number_format($data['price'], 2, '.', '');
            $hashedSecret = strtoupper(md5($this->merchantSecret));
            $hash = strtoupper(md5($this->merchantId . $data['order_id'] . $amount . $data['currency'] . $hashedSecret));

            $formInputs = [
                'merchant_id' => $this->merchantId,
                'return_url'   => $data['return_url'],
                'cancel_url'   => $data['cancel_url'],
                'notify_url'   => $data['notify_url'],
                'order_id'     => $data['order_id'],
                'items'        => $data['product'],
                'currency'     => $data['currency'],
                'amount'       => $amount,
                'first_name'   => $data['name'],
                'last_name'    => '',
                'email'        => $data['email'],
                'phone'        => '',
                'address'      => '',
                'city'         => '',
                'country'      => 'Sri Lanka',
                'hash'         => $hash
            ];

            $formHtml = '<form id="payhere-form" action="' . $this->baseUrl . '/pay/checkout" method="POST">';
            foreach ($formInputs as $name => $value) {
                $formHtml .= '<input type="hidden" name="' . htmlspecialchars($name) . '" value="' . htmlspecialchars($value) . '">';
            }
            $formHtml .= '</form><script>document.getElementById("payhere-form").submit();</script>';

            return (object) ['success' => true, 'html' => $formHtml];
        } catch (\Exception $e) {
            return (object) ['success' => false, 'message' => $e->getMessage()];
        }
    }

    // In the sandbox environment, payment verification is not possible. 
    // If you still want to test the flow, you can manually pass the verification as successful by setting the success parameter to true.
    public function verifyTransaction($orderId)
    {
        try {
            $tokenResponse = Http::asForm()->withHeaders([
                'Authorization' => 'Basic ' . base64_encode($this->appId . ':' . $this->appSecret)
            ])->post($this->baseUrl . '/merchant/v1/oauth/token', [
                'grant_type' => 'client_credentials'
            ]);


            if (!$tokenResponse->successful()) {
                return ['success' => false, 'message' => __('Token generation failed')];
            }

            $accessToken = $tokenResponse->json()['access_token'];

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type'  => 'application/json',
            ])->get($this->baseUrl . '/merchant/v1/payment/search', [
                'order_id' => $orderId
            ]);

            if ($response->successful() && isset($response->json()['data'][0])) {
                $paymentData = $response->json()['data'][0];
                if ($paymentData['status'] == 'RECEIVED') {
                    return ['success' => true];
                }
            }

            return ['success' => false, 'message' => __('Payment not verified or failed')];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function isPaymentSuccessful($result): bool
    {
        return isset($result['success']) && $result['success'] === true;
    }
}
