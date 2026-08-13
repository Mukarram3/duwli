import { useState } from 'react';
import { router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { InputError } from '@/components/ui/input-error';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimePicker } from '@/components/ui/time-picker';
import { CreateCallProps } from './types';

const emptyForm = { subject: '', call_type: 'Outbound', duration: '', assignee: '', description: '', call_result: '' };

export default function Create({ leadId, userLeads, onSuccess }: CreateCallProps) {
    const { t } = useTranslation();
    const { errors } = usePage().props as any;
    const [form, setForm] = useState({ ...emptyForm });
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.post(route('lead.calls.store'), { lead_id: leadId, ...form }, {
            onSuccess: () => { setForm({ ...emptyForm }); onSuccess(); },
            onFinish: () => setLoading(false),
        });
    };

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{t('Create Call')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="subject" required>{t('Subject')}</Label>
                    <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={t('Enter call subject')} />
                    <InputError message={errors.subject} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="call_type" required>{t('Call Type')}</Label>
                        <Select value={form.call_type} onValueChange={(v) => setForm({ ...form, call_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Inbound">{t('Inbound')}</SelectItem>
                                <SelectItem value="Outbound">{t('Outbound')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.call_type} />
                    </div>
                    <div>
                        <Label htmlFor="duration" required>{t('Duration')}</Label>
                        <TimePicker id="duration" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} placeholder={t('Select Duration')} />
                        <InputError message={errors.duration} />
                    </div>
                </div>
                <div>
                    <Label htmlFor="assignee" required>{t('Assignee')}</Label>
                    <Select value={form.assignee} onValueChange={(v) => setForm({ ...form, assignee: v })}>
                        <SelectTrigger><SelectValue placeholder={t('Select assignee')} /></SelectTrigger>
                        <SelectContent>
                            {userLeads?.map((ul: any) => (
                                <SelectItem key={ul.user?.id} value={ul.user?.id?.toString() || ''}>{ul.user?.name || ''}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.assignee} />
                </div>
                <div>
                    <Label htmlFor="description">{t('Description')}</Label>
                    <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('Enter call description')} rows={3} />
                    <InputError message={errors.description} />
                </div>
                <div>
                    <Label htmlFor="call_result">{t('Call Result')}</Label>
                    <RichTextEditor content={form.call_result} onChange={(v) => setForm({ ...form, call_result: v })} placeholder={t('Enter call result')} className="mt-1" />
                    <InputError message={errors.call_result} />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>{t('Cancel')}</Button>
                    <Button type="submit" disabled={loading}>{loading ? t('Creating...') : t('Create')}</Button>
                </div>
            </form>
        </DialogContent>
    );
}
