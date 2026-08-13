import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { route } from 'ziggy-js';

interface ConversionSetupProps {
  formId: number;
  auth: any;
  initialData?: {
    conversion?: {
      module_name: string;
      submodule_name?: string;
      is_active: boolean;
      field_mappings: Record<string, number>;
    };
    available_modules: Record<string, any>;
    form_fields: Array<{
      id: number;
      label: string;
      type: string;
    }>;
    users?: Array<{
      id: number;
      name: string;
    }>;
  };
}

export default function ConversionSetup({ formId, auth, initialData }: ConversionSetupProps) {
  const { t } = useTranslation();
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedSubmodule, setSelectedSubmodule] = useState<string>('');
  const [moduleFields, setModuleFields] = useState<Record<string, any>>({});

  const { data, setData, post, processing, errors } = useForm({
    module_name: initialData?.conversion?.module_name || '',
    submodule_name: initialData?.conversion?.submodule_name || '',
    is_active: initialData?.conversion?.is_active || false,
    field_mappings: initialData?.conversion?.field_mappings || {},
  });



  useEffect(() => {
    if (initialData?.conversion) {
      setSelectedModule(initialData.conversion.module_name);
      setSelectedSubmodule(initialData.conversion.submodule_name || '');
    }
  }, [initialData]);

  useEffect(() => {
    if (selectedModule && initialData?.available_modules[selectedModule]) {
      const moduleData = initialData.available_modules[selectedModule];
      if (selectedSubmodule && moduleData[selectedSubmodule]) {
        setModuleFields(moduleData[selectedSubmodule]);
        setData('submodule_name', selectedSubmodule);
      } else if (typeof moduleData === 'object' && !Array.isArray(moduleData)) {
        // If no submodule selected, use first available submodule
        const firstSubmodule = Object.keys(moduleData)[0];
        setSelectedSubmodule(firstSubmodule);
        setData('submodule_name', firstSubmodule);
        setModuleFields(moduleData[firstSubmodule]);
      }
    }
  }, [selectedModule, selectedSubmodule, initialData, setData]);

  const handleModuleChange = (moduleName: string) => {
    if (moduleName === 'no_module') {
      setSelectedModule('');
      setSelectedSubmodule('');
      setData('module_name', '');
      setData('submodule_name', '');
      setData('field_mappings', {});
    } else {
      setSelectedModule(moduleName);
      setSelectedSubmodule('');
      setData('module_name', moduleName);
      setData('submodule_name', '');
      setData('field_mappings', {});
    }
  };

  const handleSubmoduleChange = (submoduleName: string) => {
    if (submoduleName === 'no_submodule') {
      setSelectedSubmodule('');
      setData('submodule_name', '');
      setData('field_mappings', {});
    } else {
      setSelectedSubmodule(submoduleName);
      setData('submodule_name', submoduleName);
      setData('field_mappings', {});
    }
  };

  const handleFieldMapping = (moduleFieldKey: string, formFieldId: string) => {
    const newMappings = { ...data.field_mappings };
    if (formFieldId === 'not_mapped' || formFieldId === '') {
      delete newMappings[moduleFieldKey];
    } else {
      if (hasStringOptions(moduleFieldKey)) {
        newMappings[moduleFieldKey] = formFieldId;
      } else {
        newMappings[moduleFieldKey] = parseInt(formFieldId);
      }
    }
    setData('field_mappings', newMappings);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all fields are mapped if conversion is active
    if (data.is_active && selectedModule && Object.keys(moduleFields).length > 0) {
      const unmappedFields = Object.keys(moduleFields).filter(fieldKey => {
        const mapping = data.field_mappings[fieldKey];
        return !mapping ||
          mapping === '' ||
          mapping === 'not_mapped' ||
          (Array.isArray(mapping) && mapping.length === 0);
      });

      if (unmappedFields.length > 0) {
        const fieldNames = unmappedFields.map(key =>
          typeof moduleFields[key] === 'string' ? moduleFields[key] : moduleFields[key]?.label || key
        ).join(', ');

        toast.error(t('Please map all required fields: {{fields}}', {
          fields: fieldNames
        }));
        return;
      }
    }

    post(route('formbuilder.forms.conversion.update', formId), {
      onSuccess: () => {
      },
    });
  };



  const getFieldOptions = (fieldKey: string) => {
    const fieldConfig = initialData?.available_modules?.[selectedModule]?.[selectedSubmodule]?.[fieldKey];
    return fieldConfig?.options || null;
  };

  const hasStringOptions = (fieldKey: string) => {
    const options = getFieldOptions(fieldKey);
    return options && options.length > 0 && typeof options[0]?.id === 'string';
  };


  const getAvailableModules = () => {
    return Object.keys(initialData?.available_modules || {});
  };

  const getAvailableSubmodules = () => {
    if (!selectedModule || !initialData?.available_modules[selectedModule]) return [];
    const moduleData = initialData.available_modules[selectedModule];
    if (Array.isArray(moduleData)) return [];
    return Object.keys(moduleData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Settings */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          {/* Activation & Selection Card */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-card text-card-foreground">
            <CardHeader className="border-b dark:border-gray-800 pb-4">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {t('Conversion Settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              {/* Activation Switch Container */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-gray-150 dark:border-gray-800/60 transition-all duration-200">
                <div className="flex flex-col gap-0.5 max-w-[80%]">
                  <Label htmlFor="is_active" className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                    {t('Enable Conversion')}
                  </Label>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">
                    {t('Automatically create records from submissions')}
                  </span>
                </div>
                <Switch
                  id="is_active"
                  checked={data.is_active}
                  onCheckedChange={(checked) => setData('is_active', checked)}
                />
              </div>

              {/* Module selection */}
              <div className="space-y-2">
                <Label htmlFor="module" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t('Target Module')}
                </Label>
                <Select value={selectedModule} onValueChange={handleModuleChange}>
                  <SelectTrigger className="h-10 bg-background border-input">
                    <SelectValue placeholder={t('Choose a module')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_module">{t('None')}</SelectItem>
                    {getAvailableModules().map((module) => (
                      <SelectItem key={module} value={module}>
                        {module}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submodule selection */}
              {getAvailableSubmodules().length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="submodule" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t('Target Submodule')}
                  </Label>
                  <Select value={selectedSubmodule} onValueChange={handleSubmoduleChange}>
                    <SelectTrigger className="h-10 bg-background border-input">
                      <SelectValue placeholder={t('Choose a submodule')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_submodule">{t('None')}</SelectItem>
                      {getAvailableSubmodules().map((submodule) => (
                        <SelectItem key={submodule} value={submodule}>
                          {submodule}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button card */}
          {auth.user?.permissions?.includes('edit-formbuilder-conversions') && (
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-card text-card-foreground">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {processing ? t('Saving changes...') : t('Ready to save')}
                </span>
                <Button
                  type="submit"
                  disabled={processing}
                >
                  {processing ? t('Saving...') : t('Save Settings')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Field Mapping */}
        <div className="lg:col-span-8">
          {selectedModule && Object.keys(moduleFields).length > 0 ? (
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-card text-card-foreground">
              <CardHeader className="border-b dark:border-gray-800 pb-4 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {t('Field Mapping Matrix')}
                  </CardTitle>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('Map form template inputs to target fields')}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-750 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800/40">
                  {Object.keys(data.field_mappings).length} / {Object.keys(moduleFields).length} {t('mapped')}
                </span>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {Object.entries(moduleFields).map(([fieldKey, fieldConfig]) => (
                  <div 
                    key={fieldKey} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-205 dark:border-gray-800/80 rounded-xl bg-gray-50/20 dark:bg-gray-900/10 hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-200"
                  >
                    {/* Left: Target field label and type */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-sm font-medium text-gray-850 dark:text-gray-200 block truncate">
                        {typeof fieldConfig === 'string' ? fieldConfig : fieldConfig?.label || fieldKey}
                      </Label>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {typeof fieldConfig === 'object' && fieldConfig?.type && (
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700/50">
                            {fieldConfig.type}
                          </span>
                        )}
                        {typeof fieldConfig === 'object' && fieldConfig?.required && (
                          <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-medium bg-red-50 text-red-750 ring-1 ring-inset ring-red-600/10 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-800/50">
                            {t('Required')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle arrow */}
                    <div className="flex justify-center shrink-0">
                      <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-600 rotate-90 sm:rotate-0 transition-transform" />
                    </div>

                    {/* Right: Selected input selection/dropdown */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {fieldConfig?.multiple ? (
                        <MultiSelectEnhanced
                          options={getFieldOptions(fieldKey)?.map((option) => ({
                            value: option.id.toString(),
                            label: option.name
                          })) || initialData?.form_fields
                            .filter((field) => {
                              const moduleFieldType = typeof fieldConfig === 'object' && fieldConfig?.type;
                              return !moduleFieldType || field.type === moduleFieldType;
                            })
                            .map((field) => ({
                              value: field.id.toString(),
                              label: field.label
                            })) || []}
                          value={(() => {
                            const currentValue = data.field_mappings[fieldKey];
                            if (Array.isArray(currentValue)) {
                              return currentValue.map(String);
                            } else if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
                              return [String(currentValue)];
                            }
                            return [];
                          })()}
                          onValueChange={(values) => {
                            if (values.length === 0) {
                              const newMappings = { ...data.field_mappings };
                              delete newMappings[fieldKey];
                              setData('field_mappings', newMappings);
                            } else {
                              const processedValues = hasStringOptions(fieldKey)
                                ? values
                                : values.map(v => parseInt(v));
                              setData('field_mappings', {
                                ...data.field_mappings,
                                [fieldKey]: processedValues
                              });
                            }
                          }}
                          placeholder={t('Select multiple options')}
                          searchable={true}
                          disabled={!auth.user?.permissions?.includes('edit-formbuilder-conversions')}
                        />
                      ) : (
                        <Select
                          value={data.field_mappings[fieldKey] ? String(data.field_mappings[fieldKey]) : 'not_mapped'}
                          onValueChange={(value) => handleFieldMapping(fieldKey, value)}
                          disabled={!auth.user?.permissions?.includes('edit-formbuilder-conversions')}
                        >
                          <SelectTrigger className="h-10 bg-background border-input">
                            <SelectValue placeholder={t('Select form field')} />
                          </SelectTrigger>
                          <SelectContent searchable={true}>
                            <SelectItem value="not_mapped">{t('Not mapped')}</SelectItem>
                            {getFieldOptions(fieldKey)?.map((option) => (
                              <SelectItem key={option.id} value={option.id.toString()}>
                                {option.name}
                              </SelectItem>
                            )) || (
                                initialData?.form_fields
                                  .filter((field) => {
                                    const moduleFieldType = typeof fieldConfig === 'object' && fieldConfig?.type;
                                    return !moduleFieldType || field.type === moduleFieldType;
                                  })
                                  .map((field) => (
                                    <SelectItem key={field.id} value={field.id.toString()}>
                                      {field.label}
                                    </SelectItem>
                                  ))
                              )}
                          </SelectContent>
                        </Select>
                      )}

                      {(data.field_mappings[fieldKey] && (Array.isArray(data.field_mappings[fieldKey]) ? data.field_mappings[fieldKey].length > 0 : true)) && (
                        <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 flex items-center gap-1 font-medium">
                          <CheckCircle className="h-3 w-3 shrink-0" />
                          {t('Mapped successfully')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/30 dark:bg-gray-900/10 p-12 text-center h-full flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-16 h-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <ArrowRight className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{t('Select a target module')}</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                {t('Choose a module on the left settings panel to start mapping form submissions to your CRM records.')}
              </p>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}