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

interface PaiementProPaymentSettings {
  paiementpro_merchant_id: string;
  paiementpro_enabled: string;
  [key: string]: any;
}

interface PaiementProPaymentSettingsProps {
  userSettings?: Record<string, string>;
  auth?: any;
}

export default function PaiementProPaymentSettings({ userSettings, auth }: PaiementProPaymentSettingsProps) {
  const { t } = useTranslation();
  const { is_demo } = usePage().props as any;
  const [isLoading, setIsLoading] = useState(false);
  const [showMerchantId, setShowMerchantId] = useState(false);
  const canEdit = auth?.user?.permissions?.includes('edit-paiement-pro-settings');
  const [settings, setSettings] = useState<PaiementProPaymentSettings>({
    paiementpro_merchant_id: userSettings?.paiementpro_merchant_id || '',
    paiementpro_enabled: userSettings?.paiementpro_enabled || 'off',
  });

  useEffect(() => {
    if (userSettings) {
      setSettings({
        paiementpro_merchant_id: userSettings?.paiementpro_merchant_id || '',
        paiementpro_enabled: userSettings?.paiementpro_enabled || 'off',
      });
    }
  }, [userSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [name]: checked ? 'on' : 'off' }));
  };

  const saveSettings = () => {
    setIsLoading(true);

    const payload = {
      ...settings,
      paiementpro_enabled: settings.paiementpro_enabled === 'on' ? 'on' : 'off'
    };

    router.post(route('paiementpro.settings.update'), {
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
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to save PaiementPro Payment settings');
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
            {t('PaiementPro Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure PaiementPro payment gateway settings')}
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
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="paiementpro_enabled" className="text-base font-medium">
                {t('Enable PaiementPro')}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t('Enable or disable PaiementPro payment gateway')}
              </p>
            </div>
            <Switch
              id="paiementpro_enabled"
              checked={settings.paiementpro_enabled === 'on'}
              onCheckedChange={(checked) => handleSwitchChange('paiementpro_enabled', checked)}
              disabled={!canEdit}
            />
          </div>

          {settings.paiementpro_enabled === 'on' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="paiementpro_merchant_id">{t('Merchant ID')}</Label>
                    <div className="relative">
                      <Input
                        id="paiementpro_merchant_id"
                        name="paiementpro_merchant_id"
                        type={showMerchantId ? 'text' : 'password'}
                        value={is_demo ? '****************' : settings.paiementpro_merchant_id}
                        onChange={handleInputChange}
                        placeholder={t('Enter PaiementPro Merchant ID')}
                        disabled={is_demo || !canEdit}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowMerchantId(!showMerchantId)}
                      >
                        {showMerchantId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('Your PaiementPro Merchant ID')}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-1 border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="font-medium mb-3 text-blue-900 dark:text-blue-100">
                    {t('How to get PaiementPro credentials')}
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('1.')} </span>
                      <span>{t('Go to')} <a href="https://www.paiementpro.net/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">{t('PaiementPro Dashboard')}</a></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('2.')} </span>
                      <span>{t('Sign in to your PaiementPro account')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('3.')} </span>
                      <span>{t('Navigate to Settings → API Credentials')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('4.')} </span>
                      <span>{t('Copy your Merchant ID')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('5.')} </span>
                      <span>{t('Paste it in the field above')}</span>
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
