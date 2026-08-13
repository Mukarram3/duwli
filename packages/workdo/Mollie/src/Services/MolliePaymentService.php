<?php

namespace Workdo\Mollie\Services;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;

class MolliePaymentService
{
    private const BASE_URL = 'https://api.mollie.com';

    private $apiKey;
    public $currency;
    public $orderId;

    public function __construct($userSlug = null)
    {
        $user = User::where('slug', $userSlug)->first() ?? null;
        $setting = $user ? getCompanyAllSetting($user->id) : getAdminAllSetting();

        $this->apiKey       = $setting['mollie_api_key'] ?? null;
        $this->currency     = $setting['defaultCurrency'] ?? '';
        $this->orderId      = strtoupper(substr(uniqid(), -12));
    }

    /**
     * Create a payment
     * 
     * @param array $paymentData
     * @return array
     * @throws Exception
     */
    public function createPayment(array $paymentData): array
    {
        try {

            $payload = [
                'amount' => [
                    'currency' => $this->currency,
                    'value' => number_format($paymentData['amount'], 2, '.', '')
                ],
                'description' => $paymentData['description'] ?? 'Payment',
                'redirectUrl' => $paymentData['redirectUrl']
            ];

            $response = $this->makeRequest('post', '/v2/payments', $payload);

            if (isset($response->json()['id'])) {
                Session::put(
                    $this->orderId,
                    array_merge(
                        $paymentData['session'],
                        ['payment_id' => $response->json()['id']]
                    )
                );
            }

            return [
                'payment_id' => $response->json()['id'] ?: null,
                'checkout_url' => $response->json()['_links']['checkout']['href'] ?: null
            ];
        } catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Retrieve a payment
     * 
     * @param string $paymentId
     * @return array
     * @throws Exception
     */
    public function retrievePayment(string $paymentId): array
    {
        try {
            $response = $this->makeRequest('get', '/v2/payments/' . $paymentId);
            return $response->json();
        } catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Check if payment is paid
     * 
     * @param string $paymentId
     * @return bool
     */
    public function isPaymentPaid($request)
    {
        try {
            $data =  Session::get($request->order_id);
            $request->merge($data);

            $payment = $this->retrievePayment($request->payment_id ?: null);
            return isset($payment['status']) && $payment['status'] === 'paid';
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Make HTTP request to Mollie API
     * 
     * @param string $method
     * @param string $endpoint
     * @param array $data
     * @return \Illuminate\Http\Client\Response
     * @throws Exception
     */
    private function makeRequest(string $method, string $endpoint, array $data = [])
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json'
        ])->baseUrl($this::BASE_URL)
            ->$method($endpoint, $data);

        if (!$response->successful()) {
            $response = json_decode($response->body());
            throw new Exception('Mollie API Error: ' . $response->detail ?: __('Unknown error'));
        }

        return $response;
    }
}
