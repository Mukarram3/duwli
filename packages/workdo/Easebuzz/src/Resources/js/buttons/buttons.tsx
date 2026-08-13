import { RadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import { getAdminSetting, getCompanySetting, getPackageFavicon } from '@/utils/helpers';
import { PhoneInputComponent } from '@/components/ui/phone-input';
import { useState, useEffect } from 'react';

// Global state to track selected payment method across all buttons
let globalSelectedPayment = '';
const setGlobalSelectedPayment = (method: string) => {
    globalSelectedPayment = method;
};

export const paymentMethodBtn = (data?: any) => {
    const { t } = useTranslation();
    const easebuzzEnabled = getAdminSetting('easebuzz_enabled');
    const [mobileNumber, setMobileNumber] = useState('');
    const [errors, setErrors] = useState<any>({});
    const [, forceUpdate] = useState({});

    // Check if this button is selected
    const isSelected = data?.selectedMethod === 'easebuzz' ||
        data?.selectedPaymentMethod === 'easebuzz' ||
        globalSelectedPayment === 'easebuzz';

    // Listen for external selection changes
    useEffect(() => {
        if (data?.selectedMethod && data.selectedMethod !== 'easebuzz') {
            setGlobalSelectedPayment(data.selectedMethod);
            forceUpdate({});
        }
        if (data?.selectedPaymentMethod && data.selectedPaymentMethod !== 'easebuzz') {
            setGlobalSelectedPayment(data.selectedPaymentMethod);
            forceUpdate({});
        }
    }, [data?.selectedMethod, data?.selectedPaymentMethod]);

    const handleSelection = (value: string) => {
        setGlobalSelectedPayment(value);
        forceUpdate({});

        // Call external handlers if they exist
        data?.onMethodChange?.(value);
        data?.onPaymentMethodChange?.(value);
    };

    const handlePhoneChange = (value: string) => {
        setMobileNumber(value);
        data?.onPhoneChange?.(value);
    };

    if (easebuzzEnabled === 'on') {
        // Build dataUrl with mobile number as query parameter
        const baseUrl = route('easebuzz.plan.pay');
        const dataUrl = mobileNumber.trim()
            ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}easebuzz_mobile=${encodeURIComponent(mobileNumber)}`
            : baseUrl;

        return [{
            id: 'easebuzz-payment',
            dataUrl: dataUrl,
            onFormSubmit: data?.onFormSubmit,
            component: (
                <div className="flex items-start gap-3 w-full">
                    <RadioGroup
                        value={isSelected ? 'easebuzz' : ''}
                        onValueChange={handleSelection}
                        className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex-shrink-0"
                    >
                        <RadioGroupItem value="easebuzz" id="easebuzz" />
                        <Label htmlFor="easebuzz" className="cursor-pointer flex items-center space-x-2">
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white">{t('Easebuzz')}</div>
                            </div>
                            <img src={getPackageFavicon('Easebuzz')} alt="Easebuzz" className="h-10 w-10" />

                        </Label>
                    </RadioGroup>
                    {isSelected && (
                        <div className="flex-1">
                            <PhoneInputComponent

                                value={mobileNumber}
                                onChange={handlePhoneChange}
                                placeholder="Enter mobile number"
                                error={errors.mobile_number}
                                required
                                name="mobile_number"
                            />
                        </div>
                    )}
                </div>
            )
        }];
    }
    return [];
};
