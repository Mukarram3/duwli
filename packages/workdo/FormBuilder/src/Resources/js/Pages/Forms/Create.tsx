import { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import InputError from '@/components/ui/input-error';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Settings, Eye, Type, Hash, 
  Calendar, FileText, CheckSquare, List, Radio, Phone, Mail, Lock, 
  Link, Clock, GripVertical, Check, EyeOff
} from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  order: number;
}

const getFieldTypes = (t: any) => [
  { value: 'text', label: t('Text Input'), icon: Type, category: 'standard', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { value: 'email', label: t('Email'), icon: Mail, category: 'standard', color: 'text-sky-600 bg-sky-50 border-sky-100' },
  { value: 'number', label: t('Number'), icon: Hash, category: 'standard', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  { value: 'tel', label: t('Phone'), icon: Phone, category: 'standard', color: 'text-teal-600 bg-teal-50 border-teal-100' },
  { value: 'url', label: t('URL'), icon: Link, category: 'standard', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { value: 'password', label: t('Password'), icon: Lock, category: 'standard', color: 'text-rose-600 bg-rose-50 border-rose-100' },
  { value: 'textarea', label: t('Textarea'), icon: FileText, category: 'standard', color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { value: 'select', label: t('Select Dropdown'), icon: List, category: 'choices', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { value: 'radio', label: t('Radio Buttons'), icon: Radio, category: 'choices', color: 'text-violet-600 bg-violet-50 border-violet-100' },
  { value: 'checkbox', label: t('Checkbox'), icon: CheckSquare, category: 'choices', color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100' },
  { value: 'date', label: t('Date'), icon: Calendar, category: 'datetime', color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
  { value: 'time', label: t('Time'), icon: Clock, category: 'datetime', color: 'text-purple-600 bg-purple-50 border-purple-100' },
];

export default function CreateForm() {
  const { t } = useTranslation();
  const [fields, setFields] = useState<FormField[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDraggable, setIsDraggable] = useState(false);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFields = [...fields];
    const draggedItem = newFields[draggedIndex];
    newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, draggedItem);

    const updatedFields = newFields.map((field, idx) => ({
      ...field,
      order: idx
    }));

    setDraggedIndex(index);
    setFields(updatedFields);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const [defaultLayout, setDefaultLayout] = useState<'single' | 'two-column' | 'card'>('single');
  const fieldTypes = getFieldTypes(t);

  const { data, setData, post, processing, errors } = useForm({
    name: '',
    is_active: true,
    default_layout: 'single',
    fields: [],
  });

  useEffect(() => {
    setData('fields', fields);
  }, [fields, setData]);

  const addFieldType = (type: string) => {
    const fieldType = fieldTypes.find(ft => ft.value === type);
    const newField: FormField = {
      id: Date.now().toString(),
      label: fieldType?.label + ' ' + t('Field') || t('New Field'),
      type: type,
      required: false,
      placeholder: t('Enter {{field}}', { field: fieldType?.label.toLowerCase() || t('text') }),
      options: needsOptions(type) ? [t('Option 1'), t('Option 2')] : [],
      order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => {
      if (field.id === id) {
        const updatedField = { ...field, ...updates };
        if (updates.label && (!field.placeholder || field.placeholder === t('Enter {{field}}', { field: field.label?.toLowerCase() }))) {
          updatedField.placeholder = t('Enter {{field}}', { field: updates.label.toLowerCase() });
        }
        return updatedField;
      }
      return field;
    }));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(field => field.id === id);
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < fields.length - 1)
    ) {
      const newFields = [...fields];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];

      const updatedFields = newFields.map((field, idx) => ({
        ...field,
        order: idx
      }));

      setFields(updatedFields);
    }
  };

  const addOption = (fieldId: string) => {
    updateField(fieldId, {
      options: [...(fields.find(f => f.id === fieldId)?.options || []), '']
    });
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.options) {
      const newOptions = [...field.options];
      newOptions[optionIndex] = value;
      updateField(fieldId, { options: newOptions });
    }
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.options) {
      updateField(fieldId, { options: field.options.filter((_, idx) => idx !== optionIndex) });
    }
  };

  const moveOption = (fieldId: string, optionIndex: number, direction: 'up' | 'down') => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.options) {
      const options = [...field.options];
      const targetIndex = direction === 'up' ? optionIndex - 1 : optionIndex + 1;

      if (targetIndex >= 0 && targetIndex < options.length) {
        [options[optionIndex], options[targetIndex]] = [options[targetIndex], options[optionIndex]];
        updateField(fieldId, { options });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('formbuilder.forms.store'), {
      onSuccess: () => router.visit(route('formbuilder.forms.index')),
    });
  };

  const needsOptions = (type: string) => ['select', 'radio'].includes(type);

  return (
    <AuthenticatedLayout
      breadcrumbs={[{ label: t('Form Builder'), url: route('formbuilder.forms.index') }, { label: t('Create') }]}
      pageTitle={t('Create Form')}
      pageActions={
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.visit(route('formbuilder.forms.index'))}>
            {t('Cancel')}
          </Button>
          <Button type="submit" form="form-builder" disabled={processing}>
            {t('Save')}
          </Button>
        </div>
      }
    >
      <Head title={t('Create Form')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Configuration Panel */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
          {/* Form Settings */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="border-b dark:border-gray-800 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                <Settings className="h-4 w-4 text-primary" />
                {t('Form Configuration')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1">
                <Label htmlFor="name">
                  {t('Form Name')}
                </Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  error={errors.name}
                  placeholder={t('Enter form name')}
                  className="bg-background border-input focus:border-primary focus:ring-1 focus:ring-primary/20"
                  required
                />
                <InputError message={errors.name} className="mt-1 text-xs" />
              </div>

              <div className="flex items-center justify-between py-2 px-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-800/60">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="is_active">{t('Enable Form')}</Label>
                  <span className="text-[10px] text-gray-500">{data.is_active ? t('Publicly accepting responses') : t('Form offline')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    data.is_active 
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                      : 'bg-red-50 text-red-700 ring-red-600/20'
                  }`}>
                    {data.is_active ? t('Active') : t('Inactive')}
                  </span>
                  <Switch
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', checked)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="default_layout">{t('Default Layout')}</Label>
                <Select
                  value={data.default_layout}
                  onValueChange={(value) => {
                    setData('default_layout', value);
                    setDefaultLayout(value as 'single' | 'two-column' | 'card');
                  }}
                >
                  <SelectTrigger className="bg-background border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">{t('Single Column')}</SelectItem>
                    <SelectItem value="two-column">{t('Two Column')}</SelectItem>
                    <SelectItem value="card">{t('Card Layout')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Real-time Stats')}</Label>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-blue-50/70 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-100/50 dark:border-blue-800/40">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{fields.length}</div>
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{t('Total Fields')}</div>
                  </div>
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100/50 dark:border-emerald-800/40">
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{fields.filter(f => f.required).length}</div>
                    <div className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 mt-0.5">{t('Required')}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Field Types */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="border-b dark:border-gray-800 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                <Plus className="h-4 w-4 text-primary" />
                {t('Available Field Types')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-3">
              <Tabs defaultValue="standard" className="w-full">
                <TabsList className="grid grid-cols-3 w-full bg-gray-100/80 dark:bg-gray-800/80 p-1 mb-4 rounded-lg">
                  <TabsTrigger value="standard" className="text-xs py-1.5">{t('Standard')}</TabsTrigger>
                  <TabsTrigger value="choices" className="text-xs py-1.5">{t('Choices')}</TabsTrigger>
                  <TabsTrigger value="datetime" className="text-xs py-1.5">{t('Time')}</TabsTrigger>
                </TabsList>

                {['standard', 'choices', 'datetime'].map((category) => (
                  <TabsContent key={category} value={category} className="mt-0">
                    <div className="grid grid-cols-2 gap-2">
                      {fieldTypes
                        .filter(type => type.category === category)
                        .map((type) => {
                          const Icon = type.icon;
                          const count = fields.filter(f => f.type === type.value).length;
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => addFieldType(type.value)}
                              className="relative flex items-center gap-2.5 p-2.5 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary hover:bg-primary/5 active:scale-[0.98] transition-all text-left group"
                            >
                              {count > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm border border-background">
                                  {count}
                                </span>
                              )}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 group-hover:scale-105 duration-200 ${type.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="font-semibold text-xs text-gray-700 dark:text-gray-300 truncate group-hover:text-primary leading-tight">
                                {t(type.label)}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Form Builder Panel */}
        <div className="lg:col-span-2">
          <form id="form-builder" onSubmit={handleSubmit}>
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader className="border-b dark:border-gray-800 pb-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                  <Eye className="h-4 w-4 text-primary" />
                  {t('Form Preview')}
                </CardTitle>
                <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-primary/10 text-primary ring-primary/20">
                  {fields.length} {fields.length === 1 ? t('Field') : t('Fields')}
                </span>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {fields.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/10 px-4">
                    <div className="w-16 h-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{t('Form canvas is empty')}</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                      {t('Click on any form element on the left panel to add it and start designing your template.')}
                    </p>
                    <div className="flex justify-center gap-2">
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20">
                        {t('Easy Configuration')}
                      </span>
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20">
                        {t('Instant Preview')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const fieldTypeInfo = fieldTypes.find(t => t.value === field.type);
                      const FieldIcon = fieldTypeInfo?.icon || Type;

                      return (
                        <div 
                          key={field.id} 
                          draggable={isDraggable}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={() => {
                            handleDragEnd();
                            setIsDraggable(false);
                          }}
                          className={`group relative transition-all duration-150 ${
                            draggedIndex === index ? 'opacity-40 scale-[0.98]' : ''
                          }`}
                        >
                          <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
                            {/* Card Drag & Header Controls Row */}
                            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors p-1"
                                  onMouseDown={() => setIsDraggable(true)}
                                  onMouseUp={() => setIsDraggable(false)}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="w-8 h-8 bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 rounded-lg flex items-center justify-center">
                                  <FieldIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                      {t('Field')} #{index + 1}
                                    </span>
                                    {field.required && (
                                      <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20">
                                        {t('Required')}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-semibold capitalize tracking-wider">
                                    {fieldTypeInfo?.label}
                                  </span>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <TooltipProvider>
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => moveField(field.id, 'up')}
                                        disabled={index === 0}
                                        className="w-7 h-7 p-0 hover:bg-gray-100 disabled:opacity-30"
                                      >
                                        <ArrowUp className="w-4 h-4 text-gray-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs"><p>{t('Move Up')}</p></TooltipContent>
                                  </Tooltip>
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => moveField(field.id, 'down')}
                                        disabled={index === fields.length - 1}
                                        className="w-7 h-7 p-0 hover:bg-gray-100 disabled:opacity-30"
                                      >
                                        <ArrowDown className="w-4 h-4 text-gray-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs"><p>{t('Move Down')}</p></TooltipContent>
                                  </Tooltip>
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeField(field.id)}
                                        className="w-7 h-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs"><p>{t('Delete Field')}</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>

                            {/* Configuration Panel Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                              <div className="md:col-span-5 space-y-1">
                                <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{t('Field Label')}</Label>
                                <Input
                                  value={field.label}
                                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                                  placeholder={t('Enter field label')}
                                  className="bg-background border-input focus:border-primary text-sm h-9"
                                />
                              </div>
                              <div className="md:col-span-5 space-y-1">
                                <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{t('Placeholder Text')}</Label>
                                <Input
                                  value={field.placeholder || ''}
                                  onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                  placeholder={t('Enter placeholder text')}
                                  className="bg-background border-input focus:border-primary text-sm h-9"
                                />
                              </div>
                              <div className="md:col-span-2 flex justify-center pb-2.5">
                                <div className="flex items-center gap-2 cursor-pointer select-none">
                                  <Switch
                                    id={`req-${field.id}`}
                                    checked={field.required}
                                    onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                                  />
                                  <Label htmlFor={`req-${field.id}`} className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer">{t('Required')}</Label>
                                </div>
                              </div>
                            </div>

                            {/* Choices Options list */}
                            {needsOptions(field.type) && (
                              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 -mx-5 -mb-5 px-5 pb-5 rounded-b-xl">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('Field Options')}</span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addOption(field.id)}
                                    className="text-xs h-7 px-2.5 text-primary border-primary/20 hover:bg-primary/5 hover:border-primary"
                                  >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    {t('Add Option')}
                                  </Button>
                                </div>
 
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                  {field.options?.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center gap-2 bg-card p-1 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                                      <div className="flex flex-row items-center gap-0.5 pl-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => moveOption(field.id, optionIndex, 'up')}
                                          disabled={optionIndex === 0}
                                          className="w-5 h-5 p-0 hover:bg-gray-100 disabled:opacity-20"
                                        >
                                          <ArrowUp className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => moveOption(field.id, optionIndex, 'down')}
                                          disabled={optionIndex === (field.options?.length || 0) - 1}
                                          className="w-5 h-5 p-0 hover:bg-gray-100 disabled:opacity-20"
                                        >
                                          <ArrowDown className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      <Input
                                        value={option}
                                        onChange={(e) => updateOption(field.id, optionIndex, e.target.value)}
                                        placeholder={`${t('Option')} ${optionIndex + 1}`}
                                        className="flex-1 h-7 text-xs border-0 focus:ring-0 focus-visible:ring-0 px-2 bg-transparent"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeOption(field.id, optionIndex)}
                                        className="w-7 h-7 p-0 text-red-500 hover:bg-red-50 rounded-md"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}