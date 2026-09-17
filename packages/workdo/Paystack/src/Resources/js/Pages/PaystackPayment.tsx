import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface PaystackPaymentProps {
    payment_data: {
        email: string;
        amount: number;
        currency: string;
        reference: string;
        callback_url: string;
        amount_original?: number;
        user_module?: string;
        duration?: string;
        coupon_code?: string;
    };
    public_key: string;
    plan_id: string;
    user_module: string;
    duration: string;
    coupon_code?: string;
}

declare global {
    interface Window {
        PaystackPop: any;
    }
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({
    payment_data,
    public_key,
    plan_id,
    user_module,
    duration,
    coupon_code
}) => {
    const { t } = useTranslation();
    useEffect(() => {
        if (payment_data && public_key) {
            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.onload = () => {
                const handler = window.PaystackPop.setup({
                    key: public_key,
                    email: payment_data.email,
                    amount: payment_data.amount,
                    currency: payment_data.currency,
                    ref: payment_data.reference,
                    metadata: {
                        custom_fields: [{
                            display_name: "Email",
                            variable_name: "email",
                            value: payment_data.email,
                        }]
                    },
                    callback: async function(response: any) {
                        // Create a form to submit the data via POST
                        const form = document.createElement('form');
                        form.method = 'POST';
                        form.action = payment_data.callback_url;

                        /*
                         * Fresh CSRF token, same reasoning as the subscription
                         * form: this is a NATIVE form POST that navigates away,
                         * so there is nothing to retry if the token is stale —
                         * the user just lands on a 419 and the payment is lost.
                         *
                         * Worse here than elsewhere: this runs in the Paystack
                         * callback, after the user has been off on the gateway,
                         * so the meta tag is older still.
                         *
                         * The meta value remains the fallback if the request
                         * fails, so a network hiccup degrades rather than
                         * blocks.
                         */
                        let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

                        try {
                            const tokenResponse = await fetch('/csrf-token', {
                                method: 'GET',
                                cache: 'no-store',
                                credentials: 'same-origin',
                                headers: { Accept: 'application/json' },
                            });

                            if (tokenResponse.ok) {
                                const payload = await tokenResponse.json();
                                if (payload?.token) {
                                    csrfToken = payload.token;
                                }
                            }
                        } catch {
                            // Fall through to the meta-tag value.
                        }

                        if (csrfToken) {
                            const csrfInput = document.createElement('input');
                            csrfInput.type = 'hidden';
                            csrfInput.name = '_token';
                            csrfInput.value = csrfToken;
                            form.appendChild(csrfInput);
                        }

                        // Add reference
                        const referenceInput = document.createElement('input');
                        referenceInput.type = 'hidden';
                        referenceInput.name = 'reference';
                        referenceInput.value = response.reference;
                        form.appendChild(referenceInput);

                        // Add other data
                        const fields = ['amount_original', 'user_module', 'duration', 'coupon_code'];
                        fields.forEach(field => {
                            if (payment_data[field as keyof typeof payment_data] !== undefined) {
                                const input = document.createElement('input');
                                input.type = 'hidden';
                                input.name = field;
                                input.value = String(payment_data[field as keyof typeof payment_data]);
                                form.appendChild(input);
                            }
                        });

                        document.body.appendChild(form);
                        form.submit();
                    },
                    onClose: function() {
                        window.history.back()
                    }
                });
                handler.openIframe();
            };
            document.head.appendChild(script);
        }
    }, [payment_data, public_key]);

    return (
        <>
            <Head title={t('Paystack Payment')} />
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('Redirecting to Paystack...')}</p>
                </div>
            </div>
        </>
    );
};

export default PaystackPayment;