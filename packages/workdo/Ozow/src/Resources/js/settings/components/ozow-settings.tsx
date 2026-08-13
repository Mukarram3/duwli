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

interface OzowSettings {
  ozow_site_key: string;
  ozow_private_key: string;
  ozow_api_key: string;
  ozow_mode: string;
  ozow_enabled: string;
  [key: string]: any;
}

interface OzowSettingsProps {
  userSettings?: Record<string, string>;
  auth?: any;
  globalSettings?: Record<string, string>;
}

export default function OzowSettings({ userSettings, auth, globalSettings }: OzowSettingsProps) {
  const { t } = useTranslation();
  const { is_demo } = usePage().props as any;
  const [isLoading, setIsLoading] = useState(false);
  const [showSiteKey, setShowSiteKey] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const canEdit = auth?.user?.permissions?.includes('edit-ozow-settings');
  const [settings, setSettings] = useState<OzowSettings>({
    ozow_site_key: userSettings?.ozow_site_key || '',
    ozow_private_key: userSettings?.ozow_private_key || '',
    ozow_api_key: userSettings?.ozow_api_key || '',
    ozow_mode: userSettings?.ozow_mode || 'sandbox',
    ozow_enabled: userSettings?.ozow_enabled || 'off',
  });

  useEffect(() => {
    if (userSettings) {
      setSettings({
        ozow_site_key: userSettings?.ozow_site_key || '',
        ozow_private_key: userSettings?.ozow_private_key || '',
        ozow_api_key: userSettings?.ozow_api_key || '',
        ozow_mode: userSettings?.ozow_mode || 'sandbox',
        ozow_enabled: userSettings?.ozow_enabled || 'off',
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
      ozow_enabled: settings.ozow_enabled === 'on' ? 'on' : 'off'
    };

    router.post(route('ozow.settings.update'), {
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
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to save ozow settings');
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
            {t('Ozow Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure Ozow payment gateway settings')}
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
          {/* Enable/Disable Ozow */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="ozow_enabled" className="text-base font-medium">
                {t('Enable Ozow')}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t('Enable or disable Ozow payment gateway')}
              </p>
            </div>
            <Switch
              id="ozow_enabled"
              checked={settings.ozow_enabled === 'on'}
              onCheckedChange={(checked) => handleSwitchChange('ozow_enabled', checked)}
              disabled={!canEdit}
            />
          </div>

          {settings.ozow_enabled === 'on' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side - Form Fields */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Ozow Mode */}
                  <div className="space-y-3">
                    <Label>{t('Ozow Mode')}</Label>
                    <RadioGroup
                      value={settings.ozow_mode}
                      onValueChange={(value) => handleSelectChange('ozow_mode', value)}
                      disabled={!canEdit}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sandbox" id="ozow-sandbox" />
                        <Label htmlFor="ozow-sandbox">{t('Sandbox')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="live" id="ozow-live" />
                        <Label htmlFor="ozow-live">{t('Live')}</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      {settings.ozow_mode === 'sandbox'
                        ? t('Use sandbox credentials for development and testing')
                        : t('Use live credentials for production transactions')
                      }
                    </p>
                  </div>

                  {/* Ozow Site Key */}
                  <div className="space-y-3">
                    <Label htmlFor="ozow_site_key">{t('Ozow Site Key')}</Label>
                    <div className="relative">
                      <Input
                        id="ozow_site_key"
                        name="ozow_site_key"
                        type={showSiteKey ? 'text' : 'password'}
                        value={is_demo ? '****************' : settings.ozow_site_key}
                        onChange={handleInputChange}
                        placeholder={t('Enter Ozow site key')}
                        disabled={is_demo || !canEdit}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowSiteKey(!showSiteKey)}
                      >
                        {showSiteKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('Ozow site key for payment integration')}
                    </p>
                  </div>

                  {/* Ozow Private Key */}
                  <div className="space-y-3">
                    <Label htmlFor="ozow_private_key">{t('Ozow Private Key')}</Label>
                    <div className="relative">
                      <Input
                        id="ozow_private_key"
                        name="ozow_private_key"
                        type={showPrivateKey ? 'text' : 'password'}
                        value={is_demo ? '****************' : settings.ozow_private_key}
                        onChange={handleInputChange}
                        placeholder={t('Enter Ozow private key')}
                        disabled={is_demo || !canEdit}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                      >
                        {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('Ozow private key for payment processing')}
                    </p>
                  </div>

                  {/* Ozow API Key */}
                  <div className="space-y-3">
                    <Label htmlFor="ozow_api_key">{t('Ozow API Key')}</Label>
                    <div className="relative">
                      <Input
                        id="ozow_api_key"
                        name="ozow_api_key"
                        type={showApiKey ? 'text' : 'password'}
                        value={is_demo ? '****************' : settings.ozow_api_key}
                        onChange={handleInputChange}
                        placeholder={t('Enter Ozow API key')}
                        disabled={is_demo || !canEdit}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('Ozow API key for payment processing')}
                    </p>
                  </div>
                </div>

                {/* Right Side - Guide */}
                <div className="lg:col-span-1 border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="font-medium mb-3 text-blue-900 dark:text-blue-100">
                    {t('How to get Ozow API keys')}
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('1.')} </span>
                      <span>{t('Go to')} <a href="https://ozow.com/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">{t('Ozow Portal')}</a></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('2.')} </span>
                      <span>{t('Sign in to your Ozow account or create a new one')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('3.')} </span>
                      <span>{t('Navigate to Settings → API Keys')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('4.')} </span>
                      <span>{t('Copy site key, private key, and API key to the fields above')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[20px]">{t('5.')} </span>
                      <span>{t('Select "Sandbox" mode for testing or "Live" mode for production')}</span>
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