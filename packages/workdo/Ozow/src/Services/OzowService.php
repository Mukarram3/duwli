<?php

namespace Workdo\Ozow\Services;

use Illuminate\Support\Facades\Session;

class OzowService
{
    private $siteKey;
    private $privateKey;
    private $apiKey;
    private $isTest;
    private $currency;

    public function __construct($userId = null, $isPlan = false)
    {
        $setting = $isPlan ? getAdminAllSetting() : getCompanyAllSetting($userId);

        $this->siteKey = $setting['ozow_site_key'] ?? '';
        $this->privateKey = $setting['ozow_private_key'] ?? '';
        $this->apiKey = $setting['ozow_api_key'] ?? '';
        $this->isTest = ($setting['ozow_mode'] ?? 'sandbox') === 'sandbox';
        $this->currency = $setting['defaultCurrency'] ?? '';
    }

    public function createPayment($amount, $successUrl, $errorUrl, $cancelUrl, $orderID, $sessionData = [])
    {

        try {
            $countryCode = "ZA";
            $currencyCode = $this->currency;
            $bankReference = substr($orderID, 0, 20);
            $transactionReference = $orderID;
            $isTest = $this->isTest ? 'true' : 'false';
            $formattedAmount = number_format($amount, 2, '.', '');

            $inputString = $this->siteKey .
                $countryCode .
                $currencyCode .
                $formattedAmount .
                $transactionReference .
                $bankReference .
                $cancelUrl .
                $errorUrl .
                $successUrl .
                $successUrl .
                $isTest .
                $this->privateKey;


            $hashCheck = hash('sha512', strtolower($inputString));

            $data = [
                "siteCode" => $this->siteKey,
                "countryCode" => $countryCode,
                "currencyCode" => $currencyCode,
                "amount" => $formattedAmount,
                "transactionReference" => $transactionReference,
                "bankReference" => $bankReference,
                "cancelUrl" => $cancelUrl,
                "errorUrl" => $errorUrl,
                "successUrl" => $successUrl,
                "notifyUrl" => $successUrl,
                "isTest" => $this->isTest,
                "hashCheck" => $hashCheck,
            ];

            $curl = curl_init();
            curl_setopt_array($curl, array(
                CURLOPT_URL => 'https://api.ozow.com/postpaymentrequest',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => json_encode($data),
                CURLOPT_HTTPHEADER => array(
                    'Accept: application/json',
                    'ApiKey: ' . $this->apiKey,
                    'Content-Type: application/json'
                ),
            ));

            $response = curl_exec($curl);
            $err = curl_error($curl);
            curl_close($curl);

            if ($err) {
                return ['success' => false, 'error' => $err];
            }
            
            $responseData = json_decode($response, true);

            if (isset($responseData['url'])) {

                if (!empty($sessionData)) {
                    Session::put($orderID, $sessionData);

                }
                return [
                    'success' => true,
                    'payment_url' => $responseData['url'],
                    'transaction_id' => $responseData['transactionId'] ?? null
                ];
            }

            return [
                'success' => false,
                'error' => $responseData['errorMessage'] ?? ($responseData['message'] ?? __('Payment failed'))
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function isPaymentSuccessful($request): bool
    {
        return isset($request['status']) && $request['status'] === 'success' && isset($request['Status']) && $request['Status'] === 'Complete';
    }
}
