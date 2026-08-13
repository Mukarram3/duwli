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

interface PayHereSettings {
  payhere_merchant_id: string;
  payhere_merchant_secret: string;
  payhere_app_id: string;
  payhere_app_secret: string;
  payhere_mode: string;
  payhere_enabled: string;
  [key: string]: any;
}

interface PayHereSettingsProps {
  userSettings?: Record<string, string>;
  auth?: any;
}

export default function PayHereSettings({ userSettings, auth }: PayHereSettingsProps) {
  const { t } = useTranslation();
  const { is_demo } = usePage().props as any;
  const [isLoading, setIsLoading] = useState(false);
  const [showMerchantSecret, setShowMerchantSecret] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);
  const canEdit = auth?.user?.permissions?.includes('edit-payhere-settings');
  const [settings, setSettings] = useState<PayHereSettings>({
    payhere_merchant_id: userSettings?.payhere_merchant_id || '',
    payhere_merchant_secret: userSettings?.payhere_merchant_secret || '',
    payhere_app_id: userSettings?.payhere_app_id || '',
    payhere_app_secret: userSettings?.payhere_app_secret || '',
    payhere_mode: userSettings?.payhere_mode || 'sandbox',
    payhere_enabled: userSettings?.payhere_enabled || 'off',
  });

  useEffect(() => {
    if (userSettings) {
      setSettings({
        payhere_merchant_id: userSettings?.payhere_merchant_id || '',
        payhere_merchant_secret: userSettings?.payhere_merchant_secret || '',
        payhere_app_id: userSettings?.payhere_app_id || '',
        payhere_app_secret: userSettings?.payhere_app_secret || '',
        payhere_mode: userSettings?.payhere_mode || 'sandbox',
        payhere_enabled: userSettings?.payhere_enabled || 'off',
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
      payhere_enabled: settings.payhere_enabled === 'on' ? 'on' : 'off'
    };

    router.post(route('payhere.settings.update'), {
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
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to save PayHere settings');
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
            {t('PayHere Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure PayHere payment gateway settings')}
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
          {/* Enable/Disable PayHere */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="payhere_enabled" className="text-base font-medium">
                {t('Enable PayHere')}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t('Enable or disable PayHere payment gateway')}
              </p>
            </div>
            <Switch
              id="payhere_enabled"
              checked={settings.payhere_enabled === 'on'}
              onCheckedChange={(checked) => handleSwitchChange('payhere_enabled', checked)}
              disabled={!canEdit}
            />
          </div>

          {settings.payhere_enabled === 'on' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side - Form Fields */}
                <div className="lg:col-span-2 space-y-6">
                  {/* PayHere Mode */}
                  <div className="space-y-3">
                    <Label>{t('PayHere Mode')}</Label>
                    <RadioGroup
                      value={settings.payhere_mode}
                      onValueChange={(value) => handleSelectChange('payhere_mode', value)}
                      disabled={!canEdit}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sandbox" id="payhere-sandbox" />
                        <Label htmlFor="payhere-sandbox">{t('Sandbox')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="live" id="payhere-live" />
                        <Label htmlFor="payhere-live">{t('Live')}</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      {settings.payhere_mode === 'sandbox'
                        ? t('Use sandbox credentials for development and testing')
                        : t('Use live credentials for production transactions')
                      }
                    </p>
                  </div>

                  {/* PayHere Merchant ID and App ID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="payhere_merchant_id">{t('PayHere Merchant ID')}</Label>
                      <Input
                        id="payhere_merchant_id"
                        name="payhere_merchant_id"
                        type="text"
                        value={is_demo ? '****************' : settings.payhere_merchant_id}
                        onChange={handleInputChange}
                        placeholder={t('Enter PayHere merchant ID')}
                        disabled={is_demo || !canEdit}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('PayHere merchant ID for payment integration')}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="payhere_app_id">{t('PayHere App ID')}</Label>
                      <Input
                        id="payhere_app_id"
                        name="payhere_app_id"
                        type="text"
                        value={is_demo ? '****************' : settings.payhere_app_id}
                        onChange={handleInputChange}
                        placeholder={t('Enter PayHere app ID')}
                        disabled={is_demo || !canEdit}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('PayHere app ID for API integration')}
                      </p>
                    </div>
                  </div>

                  {/* PayHere Merchant Secret */}
                  <div className="space-y-3">
                    <Label htmlFor="payhere_merchant_secret">{t('PayHere Merchant Secret')}</Label>
                    <div className="relative">
                      <Input
                        id="payhere_merchant_secret"
                        name="payhere_merchant_secret"
                        type={showMerchantSecret ? 'text' : 'password'}
                        value={is_demo ? '****************' : settings.payhere_merchant_secret}
                        onChange={handleInputChange}
                        placeholder={t('Enter PayHere merchant secret')}
                        disabled={is_demo || !canEdit}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowMerchantSecret(!showMerchantSecret)}
                      >
                        {showMerchantSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('PayHere merchant secret for payment processing')}
                    </p>
                  </div>

                  {/* PayHere App Secret */}
                  <div className="space-y-3">
                    <Label htmlFor="payhere_app_secret">{t('PayHere App Secret')}</Label>
                    <div className="relative">
                      <Input
                        id="payhere_app_secret"
                        name="payhere_app_secret"
                        type={showAppSecret ? 'text' : 'password'}
                        value={is_demo ? '****************' : settings.payhere_app_secret}
                        onChange={handleInputChange}
                        placeholder={t('Enter PayHere app secret')}
                        disabled={is_demo || !canEdit}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowAppSecret(!showAppSecret)}
                      >
                        {showAppSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('PayHere app secret for API authentication')}
                    </p>
                  </div>
                </div>

                {/* Right Side - Guide */}
                <div className="lg:col-span-1 border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="font-medium mb-3 text-blue-900 dark:text-blue-100">
                    {t('How to get PayHere API credentials')}
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('1.')} </span>
                      <span>{t('Go to')} <a href="https://www.payhere.lk/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">{t('PayHere Portal')}</a></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('2.')} </span>
                      <span>{t('Sign in to your PayHere account or create a new one')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('3.')} </span>
                      <span>{t('Navigate to Settings, API and Webhooks')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('4.')} </span>
                      <span>{t('Copy Merchant ID, Merchant Secret, App ID and App Secret')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('5.')} </span>
                      <span>{t('Use sandbox credentials for testing and live for production')}</span>
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