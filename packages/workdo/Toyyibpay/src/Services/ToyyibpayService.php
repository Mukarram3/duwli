<?php

namespace Workdo\Toyyibpay\Services;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use InvalidArgumentException;

class ToyyibpayService
{
    private ?string $userSecretKey;
    private ?string $categoryCode;
    private string $baseUrl;
    private string $mode;
    private string $paymentChannel;
    private string $chargeToCustomer;
    public string $currency;

    public function __construct($userSlug = null)
    {
        $user = User::where('slug', $userSlug)->first() ?? null;
        $setting = $user ? getCompanyAllSetting($user->id) : getAdminAllSetting();

        $this->currency      = $setting['defaultCurrency'] ?? '';
        $this->userSecretKey = $setting['toyyibpay_secret_key'] ?? null;
        $this->categoryCode  = $setting['toyyibpay_category_code'] ?? null;
        $this->mode          = $setting['toyyibpay_mode'] ?? 'sandbox';
        $this->baseUrl       = $this->mode === 'live' ? 'https://toyyibpay.com' : 'https://dev.toyyibpay.com';
        $this->paymentChannel = $setting['toyyibpay_payment_channel'] ?? '2';
        $this->chargeToCustomer = $setting['toyyibpay_charge_to_customer'] ?? '1';

        if (empty($this->userSecretKey) || empty($this->categoryCode)) {
            throw new InvalidArgumentException(
                __('The Toyyibpay User Secret Key and Category Code are required.')
            );
        }
    }

    /**
     * Create a payment bill.
     */
    public function createBill(array $billData): array
    {
        $orderID = strtoupper(substr(uniqid(), -12));

        // Sanitize billName: Max 30 alphanumeric characters, space and '_' only
        $billName = preg_replace('/[^a-zA-Z0-9 _]/', '', $billData['billName'] ?? '');
        $billName = trim(substr($billName, 0, 30));
        $billName = !empty($billName) ? $billName : 'Payment';

        // Sanitize billDescription: Max 100 alphanumeric characters, space and '_' only
        $billDescription = preg_replace('/[^a-zA-Z0-9 _]/', '', $billData['billDescription'] ?? '');
        $billDescription = trim(substr($billDescription, 0, 100));
        $billDescription = !empty($billDescription) ? $billDescription : 'Payment Description';

        $payload = [
            'billName'                => $billName,
            'billDescription'         => $billDescription,
            'billCurrency'            => $this->currency,
            'billReturnUrl'           => $billData['billReturnUrl'] ?? '',
            'billCallbackUrl'         => $billData['billCallbackUrl'] ?? '',
            'billTo'                  => $billData['billTo'] ?? '',
            'billEmail'               => $billData['billEmail'] ?? '',
            'billExternalReferenceNo' => $orderID,
            'billPhone'               => $billData['billPhone'] ?? '',
            'userSecretKey'           => $this->userSecretKey,
            'categoryCode'            => $this->categoryCode,
            'billAmount'              => (int) round($billData['billAmount'] * 100),
            'billPriceSetting'        => 1,
            'billPayorInfo'           => 1,
            'billPaymentChannel'      => $this->paymentChannel,
            'billChargeToCustomer'    => $this->chargeToCustomer,
            'billExpiryDays'          => 7,
            'billExpiryDate'          => date('d-m-Y', strtotime('+7 days')),
            'billContentEmail'        => $billData['billContentEmail'] ?? __('Thank you for your payment!'),
        ];

        $response = $this->makeRequest('/index.php/api/createBill', $payload);

        if (isset($response['status']) && $response['status'] == 'error') {
            throw new Exception($response['msg'] ?? __('Invalid response from Toyyibpay API'));
        }

        if (isset($response[0]['BillCode']) && ! empty($response[0]['BillCode'])) {

            Session::flash($orderID, $billData['session'] ?? []);

            return [
                'BillCode' => $response[0]['BillCode'],
                'orderID'  => $orderID,
                'url'       => $this->baseUrl . '/' . $response[0]['BillCode'],
            ];
        }

        throw new Exception(__('Invalid response from Toyyibpay API: BillCode not found.'));
    }


    /**
     * Check whether a bill has a successful/completed transaction.
     */
    public function verifyPayment($request)
    {
        try {

            if (empty($request['billcode'] ?? null)) {
                throw new InvalidArgumentException(__('The bill code is required.'));
            }

            $payload = [
                'userSecretKey' => $this->userSecretKey,
                'billCode'      => $request['billcode'] ?? null,
            ];

            $transactions = $this->makeRequest('/index.php/api/getBillTransactions', $payload);
            $transaction = $transactions[0];

            if (isset($transaction['billpaymentStatus']) && (int) $transaction['billpaymentStatus'] === 1) {
                $sessionData = Session::get($transaction['billExternalReferenceNo']) ?? [];
                $request->merge($sessionData);
                return true;
            }

            throw new Exception(__('Payment was cancelled or failed.'));
        } catch (Exception $e) {
            throw new Exception($e->getMessage() ?? __('Something went wrong please try again.'));
        }
    }

    /**
     * Make a POST request to the Toyyibpay API.
     *
     * Toyyibpay's API accepts form-encoded POST bodies (not JSON),
     * so we use Http::asForm() here.
     *
     * @param  string  $endpoint
     * @param  array   $payload
     * @return array
     * @throws Exception
     */
    private function makeRequest(string $endpoint, array $payload): array
    {
        try {
            $response = Http::asForm()->timeout(30)
                ->post($this->baseUrl . $endpoint, $payload);

            if (! $response->successful()) {
                $errorMessage = __('The Toyyibpay request has failed.');

                $body = $response->json();
                if (! empty($body['message'])) {
                    $errorMessage = $body['message'];
                } elseif (! empty($body['error'])) {
                    $errorMessage = $body['error'];
                }

                throw new Exception($errorMessage);
            }

            $decoded = json_decode($response->body(), true);

            if ($decoded === null) {
                throw new Exception(__('An unexpected response was received from Toyyibpay.'));
            }

            return is_array($decoded) ? $decoded : [$decoded];
        } catch (Exception $e) {
            throw $e;
        }
    }
}
