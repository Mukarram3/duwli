import { useState } from 'react';
import { Head, useForm, usePage } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { useFormFields } from '@/hooks/useFormFields';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectEnhanced } from "@/components/ui/multi-select-enhanced";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import MediaPicker from "@/components/MediaPicker";
import InputError from "@/components/ui/input-error";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { CreateItemPageProps, ItemFormData } from './types';
import { 
    Info, 
    DollarSign, 
    Image as ImageIcon, 
    Warehouse, 
    ChevronRight, 
    ChevronLeft,
    Check, 
    Tag, 
    Package,
    Sparkles
} from 'lucide-react';
import { formatCurrency, getImagePath } from '@/utils/helpers';

export default function Create() {
    const { t } = useTranslation();
    const { taxes, categories, units, warehouses } = usePage<CreateItemPageProps>().props;
    const [activeTab, setActiveTab] = useState('details');

    const { data, setData, post, processing, errors } = useForm<ItemFormData>({
        name: '',
        sku: '',
        tax_ids: [],
        category_id: '',
        description: '',
        long_description: '',
        sale_price: '',
        purchase_price: '',
        unit: '',
        quantity: '',
        image: '',
        images: [],
        warehouse_id: '',
        type: 'product',
        custom_fields: {},
        has_warranty: 0,
        warranty_type: '',
        warranty_duration: '',
        warranty_terms: ''
    });

    // Get custom fields using useFormFields hook
    const customFields = useFormFields('getCustomFields', { ...data, module: 'ProductService', sub_module: 'Items' }, setData, errors, 'create', t);

    // AI hook for short description
    const descriptionAI = useFormFields('aiField', data, setData, errors, 'create', 'description', 'Short Description', 'productservice', 'item');
    // Inventory fields hook
    const inventoryFields = useFormFields('inventoryFields', data, setData, errors, 'create');
    // Warranty fields hook
    const warrantyFields = useFormFields('warrantyFields', data, setData, errors, 'create');

    const validateDetailsTab = () => {
        return data.name.trim() !== '' &&
               data.sku.trim() !== '' &&
               data.tax_ids.length > 0 &&
               data.category_id !== '';
    };

    const validatePricingTab = () => {
        const baseValidation = data.sale_price.trim() !== '' &&
               data.purchase_price.trim() !== '' &&
               data.unit !== '';

        if (data.type === 'service') {
            return baseValidation;
        }

        return baseValidation && data.quantity.trim() !== '';
    };

    const nextTab = () => {
        if (activeTab === 'details') {
            if (!validateDetailsTab()) {
                return; // Don't proceed if validation fails
            }
            setActiveTab('pricing');
        }
        else if (activeTab === 'pricing') {
            if (!validatePricingTab()) {
                return;
            }
            setActiveTab('media');
        }
        else if (activeTab === 'media') setActiveTab('warehouse');
    };

    const prevTab = () => {
        if (activeTab === 'pricing') setActiveTab('details');
        else if (activeTab === 'media') setActiveTab('pricing');
        else if (activeTab === 'warehouse') setActiveTab('media');
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('product-service.items.store'), {
            transform: (data) => {
                if (data.type === 'service') {
                    const { quantity, warehouse_id, ...serviceData } = data;
                    return serviceData;
                }

                return data;
            }
        });
    };

    const steps = [
        { id: 'details', label: t('Basic Details'), icon: Info },
        { id: 'pricing', label: t('Pricing & Units'), icon: DollarSign },
        { id: 'media', label: t('Media Gallery'), icon: ImageIcon },
        ...(data.type !== 'service' ? [{ id: 'warehouse', label: t('Warehouse Stock'), icon: Warehouse }] : [])
    ];

    return (
        <Dialog>
            <AuthenticatedLayout
                breadcrumbs={[
                    {label: t('Items'), url: route('product-service.items.index')},
                    {label: t('Create')}
                ]}
                pageTitle={t('Create Item')}
                backUrl={route('product-service.items.index')}
            >
                <Head title={t('Create Item')} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Form Column - lg:col-span-9 for 75% width */}
                    <Card className="lg:col-span-9 shadow-sm dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden rounded-xl border border-gray-200">
                        <CardContent className="p-6 md:p-8">
                            {/* Stepper Header */}
                            <div className="mb-8 border-b pb-6 dark:border-gray-800">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    {steps.map((step, index) => {
                                        const isCompleted = steps.findIndex(s => s.id === activeTab) > index;
                                        const isActive = activeTab === step.id;
                                        const Icon = step.icon;
                                        return (
                                            <div key={step.id} className="flex items-center flex-1 last:flex-initial">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (step.id === 'details') setActiveTab('details');
                                                        else if (step.id === 'pricing' && validateDetailsTab()) setActiveTab('pricing');
                                                        else if (step.id === 'media' && validateDetailsTab() && validatePricingTab()) setActiveTab('media');
                                                        else if (step.id === 'warehouse' && validateDetailsTab() && validatePricingTab() && data.type !== 'service') setActiveTab('warehouse');
                                                    }}
                                                    className={`flex items-center gap-3 text-left focus:outline-none transition-all duration-200 group rtl:text-right ${isActive ? 'text-primary' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                                                >
                                                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-200 ${isActive ? 'border-primary bg-primary/10 text-primary scale-105 shadow-sm shadow-primary/10' : isCompleted ? 'border-green-600 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400' : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-400 group-hover:border-gray-300 dark:group-hover:border-gray-700'}`}>
                                                        {isCompleted ? <Check className="h-5 w-5 animate-in fade-in zoom-in duration-250" /> : <Icon className="h-5 w-5" />}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t('Step')} {index + 1}</p>
                                                        <p className="text-sm font-bold truncate">{step.label}</p>
                                                    </div>
                                                </button>
                                                {index < steps.length - 1 && (
                                                    <ChevronRight className="hidden sm:block h-6 w-6 text-gray-500 dark:text-gray-400 mx-auto rtl:rotate-180 stroke-[2.5]" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsContent value="details" className="space-y-6 mt-0">
                                        {/* Row 1: Item Type & Name (2 fields) */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="type" className="font-semibold text-gray-700 dark:text-gray-300">{t('Item Type')}</Label>
                                                <Select value={data.type || ''} onValueChange={(value) => {
                                                    setData('type', value);
                                                    if (value === 'service') {
                                                        setData('quantity', '');
                                                        setData('warehouse_id', '');
                                                    }
                                                }}>
                                                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-800 focus:ring-primary/20 focus:border-primary">
                                                        <SelectValue placeholder={t('Select Type')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="product">{t('Product')}</SelectItem>
                                                        <SelectItem value="service">{t('Service')}</SelectItem>
                                                        <SelectItem value="part">{t('Part')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.type} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="font-semibold text-gray-700 dark:text-gray-300">{t('Name')}</Label>
                                                <Input
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder={t('Enter Name')}
                                                    className="rounded-xl border-gray-200 dark:border-gray-800 focus:ring-primary/20 focus:border-primary"
                                                    required
                                                />
                                                <InputError message={errors.name} />
                                            </div>
                                        </div>

                                        {/* Row 2: SKU & Category (2 fields) */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="sku" className="font-semibold text-gray-700 dark:text-gray-300">{t('SKU')}</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="sku"
                                                        value={data.sku}
                                                        onChange={(e) => setData('sku', e.target.value)}
                                                        placeholder={t('Enter SKU')}
                                                        className="rounded-xl border-gray-200 dark:border-gray-800 focus:ring-primary/20 focus:border-primary flex-1"
                                                        required
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setData('sku', 'SKU-' + Date.now())}
                                                        className="rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold"
                                                    >
                                                        {t('Generate')}
                                                    </Button>
                                                </div>
                                                <InputError message={errors.sku} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="category_id" required className="font-semibold text-gray-700 dark:text-gray-300">{t('Category')}</Label>
                                                <Select value={data.category_id} onValueChange={(value) => setData('category_id', value)} required>
                                                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-800 focus:ring-primary/20 focus:border-primary">
                                                        <SelectValue placeholder={t('Select Category')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {categories.map((category) => (
                                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                                {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.category_id} />
                                            </div>
                                        </div>

                                        {/* Row 3: Tax (1 field taking half row width) */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="tax_ids" required className="font-semibold text-gray-700 dark:text-gray-300">{t('Tax')}</Label>
                                                <MultiSelectEnhanced
                                                    options={taxes.map(tax => ({
                                                        value: tax.id.toString(),
                                                        label: `${tax.tax_name} (${tax.rate}%)`
                                                    }))}
                                                    value={data.tax_ids}
                                                    onValueChange={(value) => setData('tax_ids', value)}
                                                    placeholder={t('Select Taxes')}
                                                />
                                                <InputError message={errors.tax_ids} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="font-semibold text-gray-700 dark:text-gray-300">{t('Short Description')}</Label>
                                            <div className="flex gap-2 items-start">
                                                <Textarea
                                                    id="description"
                                                    value={data.description}
                                                    onChange={(e) => setData('description', e.target.value)}
                                                    placeholder={t('Enter Short Description')}
                                                    className="rounded-xl border-gray-200 dark:border-gray-800 focus:ring-primary/20 focus:border-primary flex-1"
                                                    rows={3}
                                                />
                                                {descriptionAI.map(field => <div key={field.id}>{field.component}</div>)}
                                            </div>
                                            <InputError message={errors.description} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="long_description" className="font-semibold text-gray-700 dark:text-gray-300">{t('Description')}</Label>
                                            <div className="overflow-hidden rounded-xl">
                                                <RichTextEditor
                                                    className="[&_.ProseMirror]:min-h-[150px] [&_.ProseMirror]:max-h-[300px] [&_.ProseMirror]:overflow-y-auto border border-gray-200 dark:border-gray-800"
                                                    content={data.long_description || ''}
                                                    onChange={(value) => setData('long_description', value)}
                                                    placeholder={t('Enter Description')}
                                                />
                                            </div>
                                            <InputError message={errors.long_description} />
                                        </div>

                                        {/* Custom Fields */}
                                        {customFields && customFields.length > 0 && (
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 pt-4 border-t dark:border-gray-800">
                                                {customFields.map(field => field.component)}
                                            </div>
                                        )}

                                        {/* Warranty Fields */}
                                        {warrantyFields && warrantyFields.length > 0 && (
                                            <div className="border-t pt-6 dark:border-gray-800 space-y-4">
                                                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                    {t('Warranty Information')}
                                                </h3>
                                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                    {warrantyFields.map(field => field.component)}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-4 border-t dark:border-gray-800">
                                            <Button
                                                type="button"
                                                onClick={nextTab}
                                                disabled={!validateDetailsTab()}
                                                className="rounded-lg px-5 py-2 font-semibold flex items-center gap-2 transition-all shadow-sm"
                                            >
                                                {t('Next')}
                                                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="pricing" className="space-y-6 mt-0">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="sale_price" className="font-semibold text-gray-700 dark:text-gray-300">{t('Sale Price')}</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 font-semibold rtl:right-3 rtl:left-auto">
                                                        $
                                                    </span>
                                                    <Input
                                                        id="sale_price"
                                                        type="number"
                                                        step="0.01"
                                                        value={data.sale_price}
                                                        onChange={(e) => setData('sale_price', e.target.value)}
                                                        placeholder={t('Enter Sale Price')}
                                                        className="rounded-xl pl-8 rtl:pr-8 rtl:pl-3 border-gray-200 dark:border-gray-800 focus:ring-primary/20 focus:border-primary"
                                                        required
                                                    />
                                                </div>
                                                <InputError message={errors.sale_price} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="purchase_price" className="font-semibold text-gray-700 dark:text-gray-300">{t('Purchase Price')}</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 font-semibold rtl:right-3 rtl:left-auto">
                                                        $
                                                    </span>
                                                    <Input
                                                        id="purchase_price"
                                                        type="number"
                                                        step="0.01"
                                                        value={data.purchase_price}
                                                        onChange={(e) => setData('purchase_price', e.target.value)}
                                                        placeholder={t('Enter Purchase Price')}
                                                        className="rounded-xl pl-8 rtl:pr-8 rtl:pl-3 border-gray-200 dark:border-gray-800 focus:ring-primary/20 focus:border-primary"
                                                        required
                                                    />
                                                </div>
                                                <InputError message={errors.purchase_price} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="unit" required className="font-semibold text-gray-700 dark:text-gray-300">{t('Unit')}</Label>
                                                <Select value={data.unit} onValueChange={(value) => setData('unit', value)} required>
                                                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-800 focus:ring-primary/20 focus:border-primary">
                                                        <SelectValue placeholder={t('Select Unit')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {units.map((unit) => (
                                                            <SelectItem key={unit.id} value={unit.id.toString()}>
                                                                {unit.unit_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.unit} />
                                            </div>
                                            {data.type !== 'service' && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="quantity" className="font-semibold text-gray-700 dark:text-gray-300">{t('Quantity')}</Label>
                                                    <Input
                                                        id="quantity"
                                                        type="number"
                                                        value={data.quantity}
                                                        onChange={(e) => setData('quantity', e.target.value)}
                                                        placeholder={t('Enter Quantity')}
                                                        className="rounded-xl border-gray-200 dark:border-gray-800 focus:ring-primary/20 focus:border-primary"
                                                        required
                                                    />
                                                    <InputError message={errors.quantity} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between pt-4 border-t dark:border-gray-800">
                                            <Button type="button" variant="outline" onClick={prevTab} className="rounded-lg px-4 py-2 font-semibold border-gray-200 dark:border-gray-800 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                                                {t('Previous')}
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={nextTab}
                                                disabled={!validatePricingTab()}
                                                className="rounded-lg px-5 py-2 font-semibold flex items-center gap-2 transition-all shadow-sm"
                                            >
                                                {t('Next')}
                                                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="media" className="space-y-6 mt-0">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2 bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-155 dark:border-gray-800">
                                                <MediaPicker
                                                    label={t('Product Image')}
                                                    value={data.image}
                                                    onChange={(value) => setData('image', value)}
                                                    placeholder={t('Select image...')}
                                                    showPreview={true}
                                                />
                                                <InputError message={errors.image} />
                                            </div>
                                            <div className="space-y-2 bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-155 dark:border-gray-800">
                                                <MediaPicker
                                                    label={t('Additional Images')}
                                                    value={data.images}
                                                    onChange={(value) => setData('images', Array.isArray(value) ? value : [value].filter(Boolean))}
                                                    multiple={true}
                                                    placeholder={t('Select multiple images')}
                                                    showPreview={false}
                                                />
                                                <InputError message={errors.images} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between pt-4 border-t dark:border-gray-800">
                                            <Button type="button" variant="outline" onClick={prevTab} className="rounded-lg px-4 py-2 font-semibold border-gray-200 dark:border-gray-800 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                                                {t('Previous')}
                                            </Button>
                                            {data.type === 'service' ? (
                                                <div className="flex gap-2">
                                                    <Button type="button" variant="outline" onClick={() => window.history.back()} className="rounded-lg px-4 py-2 font-semibold border-gray-200 dark:border-gray-800">
                                                        {t('Cancel')}
                                                    </Button>
                                                    <Button type="submit" disabled={processing} className="rounded-lg px-5 py-2 font-semibold shadow-sm">
                                                        {processing ? t('Creating...') : t('Create')}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button type="button" onClick={nextTab} className="rounded-lg px-5 py-2 font-semibold flex items-center gap-2 transition-all shadow-sm">
                                                    {t('Next')}
                                                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                                                </Button>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="warehouse" className="space-y-6 mt-0">
                                        {data.type !== 'service' && (
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="warehouse_id" required className="font-semibold text-gray-700 dark:text-gray-300">{t('Warehouse')}</Label>
                                                    <Select value={data.warehouse_id} onValueChange={(value) => setData('warehouse_id', value)} required>
                                                        <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-800 focus:ring-primary/20 focus:border-primary">
                                                            <SelectValue placeholder={t('Select Warehouse')} />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            {warehouses.map((warehouse) => (
                                                                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                                    {warehouse.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError message={errors.warehouse_id} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Inventory Fields */}
                                        {data.type !== 'service' && inventoryFields.length > 0 && (
                                            <div className="pt-4 border-t dark:border-gray-800">
                                                {inventoryFields.map(field => (
                                                    <div key={field.id}>{field.component}</div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-4 border-t dark:border-gray-800">
                                            <Button type="button" variant="outline" onClick={prevTab} className="rounded-lg px-4 py-2 font-semibold border-gray-200 dark:border-gray-800 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                                                {t('Previous')}
                                            </Button>
                                            <div className="flex gap-2">
                                                <Button type="button" variant="outline" onClick={() => window.history.back()} className="rounded-lg px-4 py-2 font-semibold border-gray-200 dark:border-gray-800">
                                                    {t('Cancel')}
                                                </Button>
                                                <Button type="submit" disabled={processing} className="rounded-lg px-5 py-2 font-semibold shadow-sm">
                                                    {processing ? t('Creating...') : t('Create')}
                                                </Button>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Live Preview Column - lg:col-span-3 for 25% width */}
                    <div className="lg:col-span-3 space-y-6 hidden lg:block sticky top-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t('Live Preview')}</h3>
                            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-primary/10 text-primary ring-primary/20 animate-pulse">
                                {t('Draft')}
                            </span>
                        </div>
                        <Card className="overflow-hidden bg-white dark:bg-gray-955 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                            {/* Card Image */}
                            <div className="relative h-48 bg-gradient-to-br from-slate-50 via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-900/50 dark:to-gray-955 flex items-center justify-center overflow-hidden border-b border-gray-200 dark:border-gray-800">
                                {data.image ? (
                                    <img
                                        src={getImagePath(data.image)}
                                        alt="Preview"
                                        className="w-full h-full object-contain p-4 transition-transform duration-500 hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-700">
                                        <Package className="h-14 w-14 stroke-[1.2] text-gray-300 dark:text-gray-600" />
                                        <p className="text-xs mt-2 font-medium text-gray-400 dark:text-gray-500">{t('No image uploaded')}</p>
                                    </div>
                                )}
                            </div>
                            {/* Card Content */}
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${data.type === 'product' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-500/30' : data.type === 'service' ? 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/30 dark:text-purple-400 dark:ring-purple-500/30' : 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950/30 dark:text-orange-400 dark:ring-orange-500/30'}`}>
                                            {t(data.type)}
                                        </span>
                                        {data.category_id && (
                                            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800">
                                                {categories.find(c => c.id.toString() === data.category_id)?.name}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-50 truncate">
                                        {data.name || t('Untitled Item')}
                                    </h4>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Tag className="h-3 w-3" />
                                        {data.sku || 'SKU-XXXXXXXX'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-2.5 border border-green-200 dark:border-green-900/60">
                                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{t('Sale Price')}</p>
                                        <p className="text-sm font-bold text-green-700 dark:text-green-400 mt-0.5 truncate">
                                            {data.sale_price ? formatCurrency(parseFloat(data.sale_price)) : formatCurrency(0)}
                                        </p>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-2.5 border border-orange-200 dark:border-orange-900/60">
                                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{t('Purchase')}</p>
                                        <p className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-0.5 truncate">
                                            {data.purchase_price ? formatCurrency(parseFloat(data.purchase_price)) : formatCurrency(0)}
                                        </p>
                                    </div>
                                </div>

                                {data.description && (
                                    <div className="pt-2.5 border-t border-gray-150 dark:border-gray-900">
                                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{t('Short Description')}</p>
                                        <p className="text-xs text-gray-650 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                            {data.description}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AuthenticatedLayout>
        </Dialog>
    );
}
