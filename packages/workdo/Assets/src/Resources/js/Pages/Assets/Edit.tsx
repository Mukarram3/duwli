import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import MediaPicker from '@/components/MediaPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditAssetProps, EditAssetFormData } from './types';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import axios from 'axios';

export default function EditAsset({ asset, onSuccess }: EditAssetProps) {
    const { categories, locations } = usePage<any>().props;

    const { t } = useTranslation();
    const { data, setData, put, processing, errors } = useForm<EditAssetFormData>({
        name: asset.name ?? '',
        purchase_date: asset.purchase_date || '',
        supported_date: asset.supported_date || '',
        serial_code: asset.serial_code ?? '',
        quantity: asset.quantity ?? '',
        unit_price: asset.unit_price ?? '',
        purchase_cost: asset.purchase_cost ?? '',
        warranty_period: asset.warranty_period ?? '',
        location: asset.location ?? '',
        location_id: asset.location_id?.toString() || '',
        description: asset.description ?? '',
        image: asset.image || '',
        category_id: asset.category_id?.toString() || '',
    });



    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('assets.assets.update', asset.id), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('Edit Asset')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="name">{t('Name')}</Label>
                    <Input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder={t('Enter Name')}
                        required
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label required>{t('Purchase Date')}</Label>
                        <DatePicker
                            value={data.purchase_date}
                            onChange={(date) => setData('purchase_date', date)}
                            placeholder={t('Select Purchase Date')}
                        />
                        <InputError message={errors.purchase_date} />
                    </div>
                    <div>
                        <Label>{t('Supported Date')}</Label>
                        <DatePicker
                            value={data.supported_date}
                            onChange={(date) => setData('supported_date', date)}
                            placeholder={t('Select Supported Date')}
                        />
                        <InputError message={errors.supported_date} />
                    </div>
                </div>

                <div>
                    <Label htmlFor="category_id"  required>{t('Category')}</Label>
                    <Select value={data.category_id?.toString() || ''} onValueChange={(value) => setData('category_id', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('Select Category')} />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((item: any) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                    {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.category_id} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="serial_code">{t('Serial Code')}</Label>
                        <Input
                            id="serial_code"
                            type="text"
                            value={data.serial_code}
                            onChange={(e) => setData('serial_code', e.target.value)}
                            placeholder={t('Enter Serial Code')}
                            required
                        />
                        <InputError message={errors.serial_code} />
                    </div>
                    <div>
                        <Label htmlFor="quantity">{t('Quantity')}</Label>
                        <Input
                            id="quantity"
                            type="number"
                            step="1"
                            min="0"
                            value={data.quantity}
                            onChange={(e) => {
                                const quantity = e.target.value;
                                setData('quantity', quantity);
                                // Auto-calculate purchase cost
                                const cost = (parseFloat(quantity) || 0) * (parseFloat(data.unit_price) || 0);
                                setData('purchase_cost', cost.toFixed(2));
                            }}
                            placeholder="0"
                            required
                        />
                        <InputError message={errors.quantity} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <CurrencyInput
                            label={t('Unit Price')}
                            value={data.unit_price}
                            onChange={(value) => {
                                setData('unit_price', value);
                                // Auto-calculate purchase cost
                                const cost = (parseFloat(data.quantity) || 0) * (parseFloat(value) || 0);
                                setData('purchase_cost', cost.toFixed(2));
                            }}
                            error={errors.unit_price}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="purchase_cost">{t('Purchase Cost')}</Label>
                        <Input
                            id="purchase_cost"
                            type="text"
                            value={data.purchase_cost}
                            readOnly
                            className="bg-gray-50 cursor-not-allowed"
                            placeholder="0.00"
                        />
                        <InputError message={errors.purchase_cost} />
                    </div>
                </div>

                <div>
                    <Label htmlFor="warranty_period">{t('Warranty Period')}</Label>
                    <Input
                        id="warranty_period"
                        type="text"
                        value={data.warranty_period}
                        onChange={(e) => setData('warranty_period', e.target.value)}
                        placeholder={t('Enter Warranty Period')}

                    />
                    <InputError message={errors.warranty_period} />
                </div>

                <div>
                    <Label htmlFor="location_id">{t('Location')}</Label>
                    <Select value={data.location_id} onValueChange={(value) => setData('location_id', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('Select Location')} />
                        </SelectTrigger>
                        <SelectContent>
                            {locations?.map((location: any) => (
                                <SelectItem key={location.id} value={location.id.toString()}>
                                    {location.name} ({location.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.location_id} />
                </div>

                <div>
                    <Label htmlFor="description">{t('Description')}</Label>
                    <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder={t('Enter Description')}
                        rows={3}
                    />
                    <InputError message={errors.description} />
                </div>

                <div>
                    <MediaPicker
                        label={t('Image')}
                        value={data.image}
                        onChange={(value) => setData('image', Array.isArray(value) ? value[0] || '' : value)}
                        placeholder={t('Select Image...')}
                        showPreview={true}
                        multiple={false}
                    />
                    <InputError message={errors.image} />
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? t('Updating...') : t('Update')}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}
