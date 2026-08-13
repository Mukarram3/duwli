import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InputError } from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { EditTaskProps, EditLeadTaskFormData } from './types';

export default function Edit({ task, onSuccess }: EditTaskProps) {
    const { t } = useTranslation();

    const formatDateStr = (dateStr: string) => {
        if (!dateStr) return '';
        return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    };

    const { data, setData, put, processing, errors } = useForm<EditLeadTaskFormData>({
        name: task.name || '',
        date: formatDateStr(task.date),
        time: task.time || '',
        priority: task.priority || 'Low',
        status: task.status || 'On Going',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('lead.tasks.update', task.id), {
            onSuccess: () => onSuccess(),
        });
    };

    return (
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>{t('Edit Task')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="name" required>{t('Name')}</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder={t('Enter task name')}
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label required>{t('Date')}</Label>
                        <DatePicker
                            value={data.date}
                            onChange={(date) => setData('date', date || '')}
                            placeholder={t('Select Date')}
                        />
                        <InputError message={errors.date} />
                    </div>
                    <div>
                        <Label>{t('Time')}</Label>
                        <TimePicker
                            value={data.time}
                            onChange={(time) => setData('time', time)}
                            placeholder={t('Select Time')}
                        />
                        <InputError message={errors.time} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="priority">{t('Priority')}</Label>
                        <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">{t('Low')}</SelectItem>
                                <SelectItem value="Medium">{t('Medium')}</SelectItem>
                                <SelectItem value="High">{t('High')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.priority} />
                    </div>
                    <div>
                        <Label htmlFor="status">{t('Status')}</Label>
                        <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="On Going">{t('On Going')}</SelectItem>
                                <SelectItem value="Complete">{t('Complete')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>
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
