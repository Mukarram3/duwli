import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/helpers';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import InputError from "@/components/ui/input-error";
import { useFormFields } from '@/hooks/useFormFields';
import { ReturnAssetProps, ReturnAssetFormData } from './types';

export default function ReturnAsset({ assetAssignment, onSuccess }: ReturnAssetProps) {
    const { t } = useTranslation();

    const { data, setData, put, processing, errors } = useForm<ReturnAssetFormData>({
        returned_date: new Date().toISOString().split('T')[0],
        condition_on_return: 'excellent',
        return_notes: '',
    });

    const formFields = useFormFields('assetReturn', data, setData, errors);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('assets.asset-assignments.return', assetAssignment.id), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('Return Asset')}</DialogTitle>
            </DialogHeader>
            
            {/* Assignment Details */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">{t('Assignment Details')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-medium">{t('Asset')}:</span> {assetAssignment.asset.name}
                    </div>
                    <div>
                        <span className="font-medium">{t('Serial')}:</span> {assetAssignment.asset.serial_code}
                    </div>
                    <div>
                        <span className="font-medium">{t('Assigned To')}:</span> {assetAssignment.user.name}
                    </div>
                    <div>
                        <span className="font-medium">{t('Assigned Date')}:</span> {formatDate(assetAssignment.assigned_date)}
                    </div>
                    <div>
                        <span className="font-medium">{t('Expected Return')}:</span> {assetAssignment.expected_return_date ? formatDate(assetAssignment.expected_return_date) : t('Not specified')}
                    </div>
                    <div>
                        <span className="font-medium">{t('Original Condition')}:</span> 
                        <span className="ml-1 capitalize">{t(assetAssignment.condition_on_assignment)}</span>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>{t('Return Date')}</Label>
                        <DatePicker
                            value={data.returned_date}
                            onChange={(date) => setData('returned_date', date)}
                            placeholder={t('Select Return Date')}
                        />
                        <InputError message={errors.returned_date} />
                    </div>
                    <div>
                        <Label htmlFor="condition_on_return">{t('Condition on Return')}</Label>
                        <Select value={data.condition_on_return} onValueChange={(value) => setData('condition_on_return', value as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="excellent">{t('Excellent')}</SelectItem>
                                <SelectItem value="good">{t('Good')}</SelectItem>
                                <SelectItem value="fair">{t('Fair')}</SelectItem>
                                <SelectItem value="poor">{t('Poor')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.condition_on_return} />
                    </div>
                </div>
                
                <div>
                    <Label htmlFor="return_notes">{t('Return Notes')}</Label>
                    <Textarea
                        id="return_notes"
                        value={data.return_notes}
                        onChange={(e) => setData('return_notes', e.target.value)}
                        placeholder={t('Enter any notes about the asset condition or return process')}
                        rows={4}
                    />
                    <InputError message={errors.return_notes} />
                </div>
                
                {formFields.map((field) => (
                    <div key={field.id}>{field.component}</div>
                ))}
                
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => onSuccess()}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? t('Processing Return...') : t('Return Asset')}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}