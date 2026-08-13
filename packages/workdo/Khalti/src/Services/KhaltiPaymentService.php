<?php

namespace Workdo\Khalti\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;

class KhaltiPaymentService
{
    protected string $secretKey;
    protected string $baseUrl;
    protected string $currency;
    protected const SUPPORTED_CURRENCIES = ['NPR'];

    public function __construct(string $secretKey, bool $sandbox = true, string $currency = '')
    {
        $this->secretKey =  (string) $secretKey;
        $this->baseUrl = $sandbox ? 'https://dev.khalti.com/api/v2' : 'https://khalti.com/api/v2';
        $this->currency = strtoupper($currency);

        if (isset($currency) && !empty($currency) && !in_array($this->currency, self::SUPPORTED_CURRENCIES, true)) {
            throw new \InvalidArgumentException(
                __('Khalti does not support :currency currency. Supported currencies: :supported', [
                    'currency' => $this->currency,
                    'supported' => implode(', ', self::SUPPORTED_CURRENCIES)
                ])
            );
        }
    }

    private function client(): PendingRequest
    {
        return Http::withHeaders([
            'Authorization' => 'Key ' . $this->secretKey,
            'Content-Type'  => 'application/json',
        ])->timeout(30);
    }

    private function parseResponse(Response $response): array
    {
        return [
            'success' => $response->successful(),
            'data'    => $response->json() ?? [],
            'status'  => $response->status(),
        ];
    }

    // --------------------
    // 1. Initiate Payment
    // --------------------

    public function initiatePayment(array $payload): array
    {
        try {
            $this->validateInitiatePayload($payload);

            $response = $this->client()
                ->post("{$this->baseUrl}/epayment/initiate/", [
                    "return_url" => $payload['return_url'],
                    "website_url" => $payload['return_url'], //config('app.url')
                    "amount" => $this->rupeesToPaisa($payload['amount']),
                    "purchase_order_id" => $payload['purchase_order_id'],
                    "purchase_order_name" => $payload['purchase_order_name'] ?? 'Order #' . $payload['purchase_order_id'],
                ]);

            $result = $this->parseResponse($response);

            if (!$result['success']) {
                throw new \Exception($result['data']['detail'] ?? __('Khalti payment initiation failed.'));
            }

            if ($result['success'] && isset($payload['session']) && !empty($payload['session'])) {
                Session::put($result['data']['pidx'], $payload['session']);
            }

            return $result;
        } catch (\Exception $e) {
            return [
                'success' => false,
                'data'    => ['error' => $e->getMessage()],
                'status'  => 500,
            ];
        }
    }

    // ----------------------------------
    // 2. Payment Verification (Lookup)
    // ----------------------------------

    public function verifyPayment(string $pidx): array
    {
        if (empty(trim($pidx))) {
            return [
                'success' => false,
                'data'    => ['error' => __('pidx is required.')],
                'status'  => 422,
            ];
        }

        try {
            $response = $this->client()
                ->post("{$this->baseUrl}/epayment/lookup/", ['pidx' => $pidx]);

            $result = $this->parseResponse($response);

            return $result;
        } catch (\Exception $e) {
            return [
                'success' => false,
                'data'    => ['error' => $e->getMessage()],
                'status'  => 500,
            ];
        }
    }

    // -----------------------
    // 4. Convenience Helper
    // -----------------------

    public function rupeesToPaisa(float|int $rupees): int
    {
        return (int) round($rupees * 100);
    }

    // -----------------------
    // 5. Validation
    // -----------------------

    private function validateInitiatePayload(array $payload): void
    {
        $required = [
            'return_url',
            'amount',
            'purchase_order_id',
            'purchase_order_name',
        ];

        $missing = array_filter($required, fn($key) => empty($payload[$key]));

        if (! empty($missing)) {
            throw new \InvalidArgumentException(__('Missing required Khalti payload fields: :fields.', ['fields' => implode(', ', $missing)]));
        }
    }
}
