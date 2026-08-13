<?php

namespace Workdo\PaiementPro\Services;

use Exception;

class PaiementProPaymentService
{
    protected $merchantId;
    protected $currency;
    protected $baseUrl = 'https://www.paiementpro.net/webservice/onlinepayment/init/curl-init.php';

    public function __construct($userId, $isPlan = false)
    {
        $setting = $isPlan ? getAdminAllSetting() : getCompanyAllSetting($userId);

        $this->merchantId = $setting['paiementpro_merchant_id'] ?? '';
        $this->currency = $setting['defaultCurrency']; 
    }

    public function initializeTransaction($data)
    {
        try {
            if (empty($this->merchantId)) {
                throw new Exception(__('Merchant ID is required.'));
            }

            $referenceNumber = 'REF-' . time();

            // Prepare Payload
            $payload = [
                'merchantId'            => $this->merchantId,
                'amount'                => $data['price'],
                'description'           => $data['product'] ?? 'Payment',
                'channel'               => $data['channel'] ?? 'CARD',
                'countryCurrencyCode'   => $data['currency'] ?? $this->currency,
                'referenceNumber'       => $referenceNumber,
                'customerEmail'         => $data['email'] ?? '',
                'customerFirstName'     => $data['name'] ?? '',
                'customerLastname'      => $data['name'] ?? '',
                'customerPhoneNumber'   => $data['phone'] ?? '',
                'notificationURL'       => $data['url'],
                'returnURL'             => $data['url'],
                'returnContext'         => $data['context'] ?? '',
            ];

            $data = json_encode($payload);

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $this->baseUrl);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json; charset=utf-8'));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
            curl_setopt($ch, CURLOPT_HEADER, FALSE);
            curl_setopt($ch, CURLOPT_POST, TRUE);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);

            $response = curl_exec($ch);
            curl_close($ch);

            $responseData = json_decode($response);

            if (isset($responseData->success) && $responseData->success === true && isset($responseData->url)) {
                return (object) [
                    'success' => true,
                    'url' => $responseData->url,
                    'payment_link_id' => $referenceNumber
                ];
            } else {
                $error = $responseData->message ?? __('Initialization failed');
                throw new Exception($error);
            }

        } catch (\Exception $e) {
            return (object) [
                'success' => false,
                'message' => $e->getMessage(),
                'url' => null
            ];
        }
    }

    public function isPaymentSuccessful($request): bool
    {
        return !empty($request->responsecode) && $request->responsecode == 0;
    }
}