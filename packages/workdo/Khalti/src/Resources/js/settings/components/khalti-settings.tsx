import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CreditCard, Save, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface KhaltiSettings {
  khalti_secret_key: string;
  khalti_enabled: string;
  khalti_mode: string;
  [key: string]: any;
}

interface KhaltiSettingsProps {
  userSettings?: Record<string, string>;
  auth?: any;
  globalSettings?: Record<string, string>;
}

export default function KhaltiSettings({ userSettings, auth, globalSettings }: KhaltiSettingsProps) {
  const { t } = useTranslation();
  const { is_demo } = usePage().props as any;
  const [isLoading, setIsLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const canEdit = auth?.user?.permissions?.includes('edit-khalti-settings');
  const defaultCurrency = userSettings?.defaultCurrency || '';
  const isNPR = defaultCurrency === 'NPR';
  const [settings, setSettings] = useState<KhaltiSettings>({
    khalti_secret_key: userSettings?.khalti_secret_key || '',
    khalti_enabled: userSettings?.khalti_enabled || 'off',
    khalti_mode: userSettings?.khalti_mode || 'sandbox',
  });

  useEffect(() => {
    if (userSettings) {
      setSettings({
        khalti_secret_key: userSettings?.khalti_secret_key || '',
        khalti_enabled: userSettings?.khalti_enabled || 'off',
        khalti_mode: userSettings?.khalti_mode || 'sandbox',
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
      khalti_enabled: settings.khalti_enabled === 'on' ? 'on' : 'off'
    };

    router.post(route('khalti.settings.update'), {
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
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to save Khalti settings');
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
            {t('Khalti Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure Khalti payment gateway settings')}
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

          {/* Enable/Disable Khalti */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="khalti_enabled" className="text-base font-medium">
                {t('Enable Khalti')}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t('Enable or disable Khalti payment gateway')}
              </p>
            </div>
            <Switch
              id="khalti_enabled"
              checked={settings.khalti_enabled === 'on'}
              onCheckedChange={(checked) => handleSwitchChange('khalti_enabled', checked)}
              disabled={!canEdit}
            />
          </div>

          {settings.khalti_enabled === 'on' && (
            <>
              {/* Currency Alert */}
              {!isNPR && (
                <div className="flex items-start gap-3 p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    {t('Khalti primarily supports NPR currency. Your current default currency is')} <strong>{defaultCurrency}</strong>. {t('Please set your default currency to NPR for optimal Khalti integration.')}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side - Form Fields */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Khalti Mode */}
                  <div className="space-y-3">
                    <Label>{t('Khalti Mode')}</Label>
                    <RadioGroup
                      value={settings.khalti_mode}
                      onValueChange={(value) => handleSelectChange('khalti_mode', value)}
                      disabled={!canEdit}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sandbox" id="khalti-sandbox" />
                        <Label htmlFor="khalti-sandbox">{t('Sandbox')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="live" id="khalti-live" />
                        <Label htmlFor="khalti-live">{t('Live')}</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      {settings.khalti_mode === 'sandbox'
                        ? t('Use sandbox credentials for development and testing')
                        : t('Use live credentials for production transactions')
                      }
                    </p>
                  </div>

                  {/* Khalti Secret Key */}
                  <div className="space-y-3">
                    <Label htmlFor="khalti_secret_key">{t('Khalti Secret Key')}</Label>
                    <div className="relative">
                      <Input
                        id="khalti_secret_key"
                        name="khalti_secret_key"
                        type={showSecret ? 'text' : 'password'}
                        value={is_demo ? '****************' : settings.khalti_secret_key}
                        onChange={handleInputChange}
                        placeholder={t('Enter Khalti secret key')}
                        disabled={is_demo || !canEdit}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('Khalti secret key for secure API communication')}
                    </p>
                  </div>
                </div>

                {/* Right Side - Guide */}
                <div className="lg:col-span-1 border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="font-medium mb-3 text-blue-900 dark:text-blue-100">
                    {t('How to get Khalti API credentials')}
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('1.')} </span>
                      <span>{t('Go to')} <a href="https://khalti.com/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">{t("Khalti Dashboard")}</a></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('2.')} </span>
                      <span>{t('Sign in to your Khalti account or create a new one')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('3.')} </span>
                      <span>{t('Navigate to Developers → API Keys')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('4.')} </span>
                      <span>{t('Copy the Secret Key to the field above')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('5.')} </span>
                      <span>{t('Select "Sandbox" mode for testing or "Live" mode for production')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('6.')} </span>
                      <span>{t('Use test credentials for development and live credentials for production')}</span>
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
