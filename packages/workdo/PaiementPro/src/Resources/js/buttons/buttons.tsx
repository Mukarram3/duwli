import { RadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import { getAdminSetting, getCompanySetting, getPackageFavicon } from '@/utils/helpers';
import { useState, useEffect } from 'react';

// Global state to track selected payment method across all buttons
let globalSelectedPayment = '';
const setGlobalSelectedPayment = (method: string) => {
    globalSelectedPayment = method;
};

export const paymentMethodBtn = (data?: any) => {
    const { t } = useTranslation();
    const paiementproEnabled = getAdminSetting('paiementpro_enabled');
    const [mobileNumber, setMobileNumber] = useState('');
    const [channel, setChannel] = useState('');
    const [errors, setErrors] = useState<any>({});
    const [, forceUpdate] = useState({});

    // Check if this button is selected
    const isSelected = data?.selectedMethod === 'paiementpro' ||
        data?.selectedPaymentMethod === 'paiementpro' ||
        globalSelectedPayment === 'paiementpro';

    // Listen for external selection changes
    useEffect(() => {
        if (data?.selectedMethod && data.selectedMethod !== 'paiementpro') {
            setGlobalSelectedPayment(data.selectedMethod);
            forceUpdate({});
        }
        if (data?.selectedPaymentMethod && data.selectedPaymentMethod !== 'paiementpro') {
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

    const handleChannelChange = (value: string) => {
        setChannel(value);
        data?.onChannelChange?.(value);
    };

    if (paiementproEnabled === 'on') {
        // Build dataUrl with mobile number and channel as query parameters
        const baseUrl = route('payment.paiementpro.store');
        let dataUrl = baseUrl;
        
        if (mobileNumber.trim() || channel.trim()) {
            const params = new URLSearchParams();
            if (mobileNumber.trim()) params.append('mobile_number', mobileNumber);
            if (channel.trim()) params.append('channel', channel);
            dataUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params.toString()}`;
        }

        return [{
            id: 'paiementpro-payment',
            dataUrl: dataUrl,
            onFormSubmit: data?.onFormSubmit,
            component: (
                <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <RadioGroup
                        value={isSelected ? 'paiementpro' : ''}
                        onValueChange={handleSelection}
                        className="flex items-center"
                    >
                        <RadioGroupItem value="paiementpro" id="paiementpro" />
                        <Label htmlFor="paiementpro" className="cursor-pointer flex items-center space-x-2">
                            <img src={getPackageFavicon('PaiementPro')} alt="PaiementPro" className="h-10 w-10" />
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white">{t('PaiementPro')}</div>
                            </div>
                        </Label>
                    </RadioGroup>
                    {isSelected && (
                        <div className="w-full mt-3 flex gap-3">
                            <div className="flex-1">
                                <Label htmlFor="mobile_number" className="text-sm font-medium" required>
                                    {t('Mobile Number')}
                                </Label>
                                <Input
                                    id="mobile_number"
                                    type="text"
                                    value={mobileNumber}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Only allow numbers, plus sign, and spaces
                                        if (value === '' || /^[+\d\s]*$/.test(value)) {
                                            handlePhoneChange(value);
                                        }
                                    }}
                                    placeholder={t('Enter mobile number')}
                                    pattern="^\+\d{1,3}\d{9,13}$"
                                    required
                                    name="mobile_number"
                                />
                                <InputError message={errors.mobile_number} />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="channel" className="text-sm font-medium">{t('Channel')}</Label>
                                <Select value={channel} onValueChange={setChannel} required>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('Select Channel')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CARD">{t('CARD')}</SelectItem>
                                        <SelectItem value="MOMO">{t('MOMO')}</SelectItem>
                                        <SelectItem value="OMCIV2">{t('OMCIV2')}</SelectItem>
                                        <SelectItem value="FLOOZ">{t('FLOOZ')}</SelectItem>
                                        <SelectItem value="PAYPAL">{t('PAYPAL')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.channel} />
                            </div>
                        </div>
                    )}
                </div>
            )
        }];
    }
    return [];
};
