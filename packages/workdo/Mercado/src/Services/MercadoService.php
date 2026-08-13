<?php

namespace Workdo\Mercado\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;

class MercadoService
{
    private const BASE_URL = 'https://api.mercadopago.com';
    // private const SUPPORTED_CURRENCIES = ['ARS', 'BRL', 'CLP', 'COP', 'MXN', 'PEN', 'UYU'];

    private string $accessToken;
    private string $mode;
    private string $currency;

    public function __construct($userSlug = null, $isAdmin = false)
    {
        $user               = User::where('slug', $userSlug)->first() ?? null;
        $setting            = $isAdmin ? getAdminAllSetting() : getCompanyAllSetting($user->id);

        $this->accessToken  = $setting['mercado_access_token'] ?? null;
        $this->mode         = in_array($setting['mercado_mode'] ?? 'sandbox', ['sandbox', 'live']) ? $setting['mercado_mode'] : 'sandbox';
        $this->currency     = $setting['defaultCurrency'] ?? null;

        if (empty($this->accessToken)) {
            throw new InvalidArgumentException(
                __('The MercadoPago access token is required.')
            );
        }
    }

    /**
     * Create a Checkout Pro preference and return the redirect URL.
     */
    public function createPreference(array $data): array
    {
        try {

            $preferenceData = [
                'items' => [[
                    'title'      => $data['title'] ?? 'Payment',
                    'quantity'   => 1,
                    'unit_price' => (float) ($data['price'] ?? 0),
                    'currency_id' => $this->currency,
                ]],
                'back_urls' => [
                    'success' => $data['url'] ?? '',
                    'failure' => $data['url'] ?? '',
                    'pending' => $data['url'] ?? '',
                ],
                'auto_return' => 'all', // approved, all 
                'payer' => [
                    'name'    => $data['name'] ?? '',
                    'surname' => $data['surname'] ?? '',
                    'email'   => $data['email'] ?? '',
                    'address' => [
                        'street_name' => '',
                        'street_number' => '',
                        'zip_code' => '',
                    ],
                    'identification' => [
                        'type' => 'CPF',
                        'number' => '19119119100',
                    ],
                ]
            ];


            $response = Http::withToken($this->accessToken)
                ->timeout(30)
                ->post(self::BASE_URL . '/checkout/preferences', $preferenceData);

            if ($response->successful()) {
                $responseData = $response->json();

                $initPoint = $this->mode === 'live'
                    ? ($responseData['init_point'] ?? '')
                    : ($responseData['sandbox_init_point'] ?? '');

                return [
                    'success'       => true,
                    'init_point'    => $initPoint,
                    'preference_id' => $responseData['id'] ?? null,
                    'data'          => $responseData,
                ];
            }

            return $this->handleError($response);
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error'   => __('Failed to create payment preference: ') . $e->getMessage(),
            ];
        }
    }


    /**
     * Return true only when the payment status is 'approved'.
     */
    public function isPaymentApproved(string $paymentId): bool
    {
        try {
            $response = Http::withToken($this->accessToken)->timeout(30)->get(self::BASE_URL . "/v1/payments/{$paymentId}");
            $result  = $response->successful() ? ['success' => true, 'data' => $response->json()] : $this->handleError($response);
            return (($result['success'] && isset($result['data']['status'])) ? $result['data']['status'] : null) === 'approved';
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Translate an unsuccessful HTTP response into a structured error array.
     */
    private function handleError($response): array
    {
        $statusCode   = $response->status();
        $responseData = $response->json() ?? [];

        $errorMessage = match (true) {
            $statusCode === 401, (($responseData['code'] ?? null) === 'unauthorized') => __('Invalid access token.'),
            $statusCode === 400 => $responseData['message'] ?? (collect($responseData['cause'] ?? [])->pluck('description')->implode(', ') ?: __('Currency not supported or invalid request.')),
            $statusCode === 404 => __('Payment not found.'),
            $statusCode >= 500  => __('MercadoPago service is temporarily unavailable.'),
            default => __('Something went wrong.'),
        };

        return [
            'success'     => false,
            'error'       => $errorMessage,
            'status_code' => $statusCode,
            'response'    => $responseData,
        ];
    }
}
