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
import { CurrencyInput } from '@/components/ui/currency-input';

import { EditAssetMaintenanceProps, AssetMaintenanceFormData } from './types';

export default function Edit({ maintenance, onSuccess }: EditAssetMaintenanceProps) {
    const { t } = useTranslation();
    const { assets } = usePage<any>().props;
    const { data, setData, put, processing, errors } = useForm<AssetMaintenanceFormData>({
        asset_id: maintenance.asset_id,
        maintenance_type: maintenance.maintenance_type,
        title: maintenance.title,
        description: maintenance.description || '',
        scheduled_date: maintenance.scheduled_date,
        completed_date: maintenance.completed_date || '',
        cost: maintenance.cost?.toString() || '',
        technician_name: maintenance.technician_name || '',
        status: maintenance.status,
        priority: maintenance.priority,
        notes: maintenance.notes || '',
        next_maintenance_date: maintenance.next_maintenance_date || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('assets.asset-maintenance.update', maintenance.id), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{t('Edit Maintenance')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="asset_id" required>{t('Asset')}</Label>
                        <Select value={data.asset_id?.toString()} onValueChange={(value) => setData('asset_id', parseInt(value))}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select Asset')} />
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

                    <div>
                        <Label htmlFor="maintenance_type" required>{t('Type')}</Label>
                        <Select value={data.maintenance_type} onValueChange={(value) => setData('maintenance_type', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select Type')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="preventive">{t('Preventive')}</SelectItem>
                                <SelectItem value="corrective">{t('Corrective')}</SelectItem>
                                <SelectItem value="emergency">{t('Emergency')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.maintenance_type} />
                    </div>
                </div>

                <div>
                    <Label htmlFor="title">{t('Title')}</Label>
                    <Input
                        id="title"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder={t('Enter maintenance title')}
                        required
                    />
                    <InputError message={errors.title} />
                </div>

                <div>
                    <Label htmlFor="description">{t('Description')}</Label>
                    <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder={t('Enter description')}
                    />
                    <InputError message={errors.description} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="scheduled_date" required>{t('Scheduled Date')}</Label>
                        <DatePicker
                            value={data.scheduled_date}
                            onChange={(value) => setData('scheduled_date', value || '')}
                            placeholder={t('Select scheduled date')}
                        />
                        <InputError message={errors.scheduled_date} />
                    </div>

                    <div>
                        <Label htmlFor="completed_date">{t('Completed Date')}</Label>
                        <DatePicker
                            value={data.completed_date}
                            onChange={(value) => setData('completed_date', value || '')}
                            placeholder={t('Select completed date')}
                        />
                        <InputError message={errors.completed_date} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <CurrencyInput
                            id="cost"
                            label={t('Cost')}
                            value={data.cost}
                            onChange={(value) => setData('cost', value)}
                            placeholder={t('Enter cost')}
                            error={errors.cost}
                        />
                    </div>

                    <div>
                        <Label htmlFor="technician_name">{t('Technician Name')}</Label>
                        <Input
                            id="technician_name"
                            value={data.technician_name}
                            onChange={(e) => setData('technician_name', e.target.value)}
                            placeholder={t('Enter technician name')}
                        />
                        <InputError message={errors.technician_name} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="status" required>{t('Status')}</Label>
                        <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select Status')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="scheduled">{t('Scheduled')}</SelectItem>
                                <SelectItem value="in_progress">{t('In Progress')}</SelectItem>
                                <SelectItem value="completed">{t('Completed')}</SelectItem>
                                <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div>
                        <Label htmlFor="priority" required>{t('Priority')}</Label>
                        <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select Priority')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">{t('Low')}</SelectItem>
                                <SelectItem value="medium">{t('Medium')}</SelectItem>
                                <SelectItem value="high">{t('High')}</SelectItem>
                                <SelectItem value="critical">{t('Critical')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.priority} />
                    </div>
                </div>

                <div>
                    <Label htmlFor="next_maintenance_date">{t('Next Maintenance Date')}</Label>
                    <DatePicker
                        value={data.next_maintenance_date}
                        onChange={(value) => setData('next_maintenance_date', value || '')}
                        placeholder={t('Select next maintenance date')}
                    />
                    <InputError message={errors.next_maintenance_date} />
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
