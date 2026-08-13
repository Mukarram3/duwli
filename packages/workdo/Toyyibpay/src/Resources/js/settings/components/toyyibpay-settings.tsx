import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CreditCard, Save, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ToyyibpaySettings {
  toyyibpay_secret_key: string;
  toyyibpay_category_code: string;
  toyyibpay_enabled: string;
  toyyibpay_mode: string;
  toyyibpay_payment_channel: string;
  toyyibpay_charge_to_customer: string;
  [key: string]: any;
}

interface ToyyibpaySettingsProps {
  userSettings?: Record<string, string>;
  auth?: any;
}

export default function ToyyibpaySettings({ userSettings, auth }: ToyyibpaySettingsProps) {
  const { t } = useTranslation();
  const { is_demo } = usePage().props as any;
  const [isLoading, setIsLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const canEdit = auth?.user?.permissions?.includes('edit-toyyibpay-settings');
  
  const [settings, setSettings] = useState<ToyyibpaySettings>({
    toyyibpay_secret_key: userSettings?.toyyibpay_secret_key || '',
    toyyibpay_category_code: userSettings?.toyyibpay_category_code || '',
    toyyibpay_enabled: userSettings?.toyyibpay_enabled || 'off',
    toyyibpay_mode: userSettings?.toyyibpay_mode || 'sandbox',
    toyyibpay_payment_channel: userSettings?.toyyibpay_payment_channel || '2',
    toyyibpay_charge_to_customer: userSettings?.toyyibpay_charge_to_customer || '1',
  });

  useEffect(() => {
    if (userSettings) {
      setSettings({
        toyyibpay_secret_key: userSettings?.toyyibpay_secret_key || '',
        toyyibpay_category_code: userSettings?.toyyibpay_category_code || '',
        toyyibpay_enabled: userSettings?.toyyibpay_enabled || 'off',
        toyyibpay_mode: userSettings?.toyyibpay_mode || 'sandbox',
        toyyibpay_payment_channel: userSettings?.toyyibpay_payment_channel || '2',
        toyyibpay_charge_to_customer: userSettings?.toyyibpay_charge_to_customer || '1',
      });
    }
  }, [userSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [name]: checked ? 'on' : 'off' }));
  };

  const saveSettings = () => {
    setIsLoading(true);

    const payload = {
      ...settings,
      toyyibpay_enabled: settings.toyyibpay_enabled === 'on' ? 'on' : 'off'
    };

    router.post(route('toyyibpay.settings.update'), {
      settings: payload
    }, {
      preserveScroll: true,
      onSuccess: (page) => {
        setIsLoading(false);
        const successMessage = (page.props.flash as any)?.success;
        const errorMessage = (page.props.flash as any)?.error;

        if (successMessage) {
          toast.success(successMessage);
          router.reload({ only: ['globalSettings'] });
        } else if (errorMessage) {
          toast.error(errorMessage);
        }
      },
      onError: (errors) => {
        setIsLoading(false);
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to save toyyibpay settings');
        toast.error(errorMessage);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            {t('Toyyibpay Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure Toyyibpay payment gateway settings')}
          </p>
        </div>
        {canEdit && (
          <Button className="order-2 rtl:order-1" onClick={saveSettings} disabled={isLoading} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? t('Saving...') : t('Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Enable/Disable Toyyibpay */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="toyyibpay_enabled" className="text-base font-medium">
                {t('Enable Toyyibpay')}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t('Enable or disable Toyyibpay payment gateway')}
              </p>
            </div>
            <Switch
              id="toyyibpay_enabled"
              checked={settings.toyyibpay_enabled === 'on'}
              onCheckedChange={(checked) => handleSwitchChange('toyyibpay_enabled', checked)}
              disabled={!canEdit}
            />
          </div>

          {settings.toyyibpay_enabled === 'on' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side - Form Fields */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Toyyibpay Mode */}
                  <div className="space-y-3">
                    <Label>{t('Toyyibpay Mode')}</Label>
                    <RadioGroup
                      value={settings.toyyibpay_mode}
                      onValueChange={(value) => handleSelectChange('toyyibpay_mode', value)}
                      disabled={!canEdit}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sandbox" id="toyyibpay-sandbox" />
                        <Label htmlFor="toyyibpay-sandbox">{t('Sandbox')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="live" id="toyyibpay-live" />
                        <Label htmlFor="toyyibpay-live">{t('Live')}</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      {settings.toyyibpay_mode === 'sandbox'
                        ? t('Use sandbox credentials for development and testing')
                        : t('Use live credentials for production transactions')
                      }
                    </p>
                  </div>

                  {/* Secret Key */}
                  <div className="space-y-3">
                    <Label htmlFor="toyyibpay_secret_key">{t('Secret Key')}</Label>
                    <div className="relative">
                      <Input
                        id="toyyibpay_secret_key"
                        name="toyyibpay_secret_key"
                        type={showSecretKey ? 'text' : 'password'}
                        value={is_demo ? '****************' : settings.toyyibpay_secret_key}
                        onChange={handleInputChange}
                        placeholder={t('Enter Toyyibpay secret key')}
                        disabled={is_demo || !canEdit}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                      >
                        {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('Toyyibpay secret key for API authentication')}
                    </p>
                  </div>

                  {/* Category Code */}
                  <div className="space-y-3">
                    <Label htmlFor="toyyibpay_category_code">{t('Category Code')}</Label>
                    <Input
                      id="toyyibpay_category_code"
                      name="toyyibpay_category_code"
                      value={is_demo ? '****************' : settings.toyyibpay_category_code}
                      onChange={handleInputChange}
                      placeholder={t('Enter Toyyibpay category code')}
                      disabled={is_demo || !canEdit}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('Toyyibpay category code for payment categorization')}
                    </p>
                  </div>

                  {/* Payment Channel */}
                  <div className="space-y-3">
                    <Label>{t('Payment Channel')}</Label>
                    <RadioGroup
                      value={settings.toyyibpay_payment_channel}
                      onValueChange={(value) => handleSelectChange('toyyibpay_payment_channel', value)}
                      disabled={!canEdit}
                      className="flex flex-wrap gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2" id="channel-both" />
                        <Label htmlFor="channel-both">{t('Both FPX & CC')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="channel-fpx" />
                        <Label htmlFor="channel-fpx">{t('FPX Only')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="channel-cc" />
                        <Label htmlFor="channel-cc">{t('Credit Card Only')}</Label>
                      </div>

                    </RadioGroup>
                  </div>

                  {/* Charge To Customer */}
                  <div className="space-y-3">
                    <Label>{t('Charge To Customer')}</Label>
                    <RadioGroup
                      value={settings.toyyibpay_charge_to_customer}
                      onValueChange={(value) => handleSelectChange('toyyibpay_charge_to_customer', value)}
                      disabled={!canEdit}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="charge-owner" />
                        <Label htmlFor="charge-owner">{t('Bill Owner')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="charge-customer" />
                        <Label htmlFor="charge-customer">{t('Customer (FPX only)')}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Right Side - Guide */}
                <div className="lg:col-span-1 border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="font-medium mb-3 text-blue-900 dark:text-blue-100">
                    {t('How to get Toyyibpay API credentials')}
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('1.')} </span>
                      <span>{t('Go to')} <a href="https://toyyibpay.com/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">{t('Toyyibpay')}</a></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('2.')} </span>
                      <span>{t('Sign in to your Toyyibpay account or create a new one')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('3.')} </span>
                      <span>{t('Go to Settings > API Integration')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('4.')} </span>
                      <span>{t('Copy your Secret Key')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('5.')} </span>
                      <span>{t('Copy your Category Code')}</span>
                    </div>
                  </div>
                </div>        
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}