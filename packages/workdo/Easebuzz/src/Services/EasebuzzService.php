<?php

namespace Workdo\Easebuzz\Services;

class EasebuzzService
{
    private $merchantKey;
    private $saltKey;
    private $mode;
    private $baseUrl;

    public function __construct($merchantKey = null, $saltKey = null, $mode = 'sandbox')
    {
        $this->merchantKey = $merchantKey;
        $this->saltKey = $saltKey;
        $this->mode = $mode;
        $this->baseUrl = $mode === 'live' 
            ? 'https://pay.easebuzz.in/' 
            : 'https://testpay.easebuzz.in/';
    }

    public function initiatePayment($postData)
    {
        try {
            $postData['key'] = $this->merchantKey;
            $postData['hash'] = $this->generateHash($postData);

            $response = $this->makeRequest('payment/initiateLink', $postData);

            if ($response && isset($response['status']) && $response['status'] == 1) {
                // Construct the correct payment URL based on official implementation
                $paymentUrl = $this->baseUrl . 'pay/' . $response['data'];
                
                return [
                    'success' => true,
                    'data' => $response['data'],
                    'payment_url' => $paymentUrl
                ];
            }

            // Return more detailed error information
            return [
                'success' => false,
                'error' => $response['data'] ?? $response['msg'] ?? __('Payment initiation failed'),
                'raw_response' => $response
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'exception' => true
            ];
        }
    }

    public function verifyPayment($responseData)
    {
        try {
            if (isset($responseData['status']) && $responseData['status'] === 'success') {
                return [
                    'success' => true,
                    'data' => $responseData,
                    'status' => $responseData['error'] ?? __('Transaction is successful')
                ];
            }

            return [
                'success' => false,
                'error' => $responseData['error'] ?? __('Transaction failed')
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    private function generateHash($postData)
    {
        $hashSequence = "key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10";
        $hashVarsSeq = explode('|', $hashSequence);
        $hash_string = '';

        foreach ($hashVarsSeq as $hash_var) {
            $hash_string .= isset($postData[$hash_var]) ? $postData[$hash_var] : '';
            $hash_string .= '|';
        }

        $hash_string .= $this->saltKey;
        return strtolower(hash('sha512', $hash_string));
    }



    private function makeRequest($endpoint, $postData)
    {
        $url = $this->baseUrl . $endpoint;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new \Exception(__('HTTP Error') . ': ' . $httpCode);
        }

        return json_decode($response, true);
    }
}