import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm, usePage } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';

import { EditAssetDepreciationProps, AssetDepreciationFormData } from './types';

export default function EditAssetDepreciation({ depreciation, onSuccess }: EditAssetDepreciationProps) {
    const { t } = useTranslation();
    const { assets } = usePage<any>().props;
    const { data, setData, put, processing, errors } = useForm<AssetDepreciationFormData>({
        asset_id: depreciation.asset_id,
        depreciation_method: depreciation.depreciation_method,
        useful_life_years: depreciation.useful_life_years.toString(),
        salvage_value: depreciation.salvage_value.toString(),
        depreciation_start_date: depreciation.depreciation_start_date,
        notes: depreciation.notes || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('assets.asset-depreciation.update', depreciation.id), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{t('Edit Depreciation')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="asset_id" required>{t('Asset')}</Label>
                    <Select value={data.asset_id?.toString() || undefined} onValueChange={(value) => setData('asset_id', parseInt(value))}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('Select asset')} />
                        </SelectTrigger>
                        <SelectContent>
                            {assets?.map((asset: any) => (
                                <SelectItem key={asset.id} value={asset.id.toString()}>
                                    {asset.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.asset_id} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="depreciation_method" required>{t('Depreciation Method')}</Label>
                        <Select value={data.depreciation_method} onValueChange={(value) => setData('depreciation_method', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="straight_line">{t('Straight Line')}</SelectItem>
                                <SelectItem value="declining_balance">{t('Declining Balance')}</SelectItem>
                                <SelectItem value="sum_of_years">{t('Sum Of Years')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.depreciation_method} />
                    </div>

                    <div>
                        <Label htmlFor="useful_life_years" required>{t('Useful Life (Years)')}</Label>
                        <Input
                            id="useful_life_years"
                            type="number"
                            min="1"
                            max="50"
                            value={data.useful_life_years}
                            onChange={(e) => setData('useful_life_years', e.target.value)}
                            placeholder={t('Enter years')}
                            required
                        />
                        <InputError message={errors.useful_life_years} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="salvage_value" required>{t('Salvage Value')}</Label>
                        <Input
                            id="salvage_value"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.salvage_value}
                            onChange={(e) => setData('salvage_value', e.target.value)}
                            placeholder={t('Enter salvage value')}
                            required
                        />
                        <InputError message={errors.salvage_value} />
                    </div>

                    <div>
                        <Label htmlFor="depreciation_start_date" required>{t('Start Date')}</Label>
                        <DatePicker
                            value={data.depreciation_start_date}
                            onChange={(value) => setData('depreciation_start_date', value || '')}
                            placeholder={t('Select date')}
                        />
                        <InputError message={errors.depreciation_start_date} />
                    </div>
                </div>

                <div>
                    <Label htmlFor="notes">{t('Notes')}</Label>
                    <Textarea
                        id="notes"
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        placeholder={t('Enter notes')}
                    />
                    <InputError message={errors.notes} />
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => onSuccess()}>
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
