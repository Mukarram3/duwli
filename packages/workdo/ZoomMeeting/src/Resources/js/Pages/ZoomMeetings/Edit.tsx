import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateTimeRangePicker } from '@/components/ui/datetime-range-picker';
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditZoomMeetingProps, EditZoomMeetingFormData } from './types';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Video, Users, Calendar, Play, Check, X } from 'lucide-react';

export default function EditZoomMeeting({ zoommeeting, onSuccess }: EditZoomMeetingProps) {
    const { users } = usePage<any>().props;

    const { t } = useTranslation();
    const { data, setData, put, processing, errors } = useForm<EditZoomMeetingFormData>({
        title: zoommeeting.title ?? '',
        description: zoommeeting.description ?? '',
        meeting_password: zoommeeting.meeting_password ?? '',
        start_time: zoommeeting.start_time ?? '',
        duration: zoommeeting.duration ?? '',
        host_video: zoommeeting.host_video ?? false,
        participant_video: zoommeeting.participant_video ?? false,
        waiting_room: zoommeeting.waiting_room ?? false,
        recording: zoommeeting.recording ?? false,
        status: zoommeeting.status ?? 'Scheduled',
        participants: (zoommeeting.participants as string[]) || [],
        host_id: zoommeeting.host_id?.toString() || '',
    });



    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('zoommeeting.zoom-meetings.update', zoommeeting.id), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent className="transform-gpu sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{t('Edit Zoom Meeting')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="title">{t('Title')}</Label>
                    <Input
                        id="title"
                        type="text"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder={t('Enter Title')}
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
                        placeholder={t('Enter Description')}
                        rows={3}
                    />
                    <InputError message={errors.description} />
                </div>
                

                <div>
                    <Label htmlFor="meeting_password">{t('Meeting Password')}</Label>
                    <Input
                        id="meeting_password"
                        type="text"
                        value={data.meeting_password}
                        onChange={(e) => setData('meeting_password', e.target.value)}
                        placeholder={t('Enter Meeting Password')}
                        
                    />
                    <InputError message={errors.meeting_password} />
                </div>
                
                <div>
                    <Label required>{t('Start Time')}</Label>
                    <DateTimeRangePicker
                        value={data.start_time}
                        onChange={(value) => setData('start_time', value)}
                        placeholder={t('Select Start Time')}
                        mode="single"
                    />
                    <InputError message={errors.start_time} />
                </div>
                
                <div>
                    <Label htmlFor="duration">{t('Duration')}</Label>
                    <Input
                        id="duration"
                        type="number"
                        step="1"
                        min="0"
                        value={data.duration}
                        onChange={(e) => setData('duration', e.target.value)}
                        placeholder="0"
                        required
                    />
                    <InputError message={errors.duration} />
                </div>
                
                               <div>
                    <Label>{t('Meeting Features')}</Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                        <button
                            type="button"
                            onClick={() => setData('host_video', !data.host_video)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                data.host_video
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                    : 'border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Video className="h-4 w-4 shrink-0" />
                            {t('Host Video')}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setData('participant_video', !data.participant_video)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                data.participant_video
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                    : 'border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Video className="h-4 w-4 shrink-0" />
                            {t('Participant Video')}
                        </button>

                        <button
                            type="button"
                            onClick={() => setData('waiting_room', !data.waiting_room)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                data.waiting_room
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                    : 'border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Users className="h-4 w-4 shrink-0" />
                            {t('Waiting Room')}
                        </button>

                        <button
                            type="button"
                            onClick={() => setData('recording', !data.recording)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                data.recording
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                    : 'border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                            {t('Recording')}
                        </button>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                        <InputError message={errors.host_video} />
                        <InputError message={errors.participant_video} />
                        <InputError message={errors.waiting_room} />
                        <InputError message={errors.recording} />
                    </div>
                </div>
                
                <div>
                    <Label required>{t('Status')}</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                        {/* Scheduled Card */}
                        <button
                            type="button"
                            onClick={() => setData('status', 'Scheduled')}
                            className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all cursor-pointer select-none h-full justify-between gap-3 ${
                                data.status === 'Scheduled'
                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                                    : 'border-border bg-background hover:bg-muted/40'
                            }`}
                        >
                            <div className="flex flex-col items-center">
                                <div className="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 p-2 rounded-lg">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <span className="font-semibold text-sm mt-2 text-foreground">{t('Scheduled')}</span>
                                <span className="text-[11px] text-muted-foreground mt-1 leading-normal">{t('Meeting not started yet')}</span>
                            </div>
                            
                            <div className="flex justify-center mt-auto pt-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                    data.status === 'Scheduled' ? 'border-blue-500 text-blue-500' : 'border-muted-foreground/30'
                                }`}>
                                    {data.status === 'Scheduled' && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                    )}
                                </div>
                            </div>
                        </button>

                        {/* Started Card */}
                        <button
                            type="button"
                            onClick={() => setData('status', 'Started')}
                            className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all cursor-pointer select-none h-full justify-between gap-3 ${
                                data.status === 'Started'
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                                    : 'border-border bg-background hover:bg-muted/40'
                            }`}
                        >
                            <div className="flex flex-col items-center">
                                <div className="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 p-2 rounded-lg">
                                    <Play className="h-5 w-5" />
                                </div>
                                <span className="font-semibold text-sm mt-2 text-foreground">{t('Started')}</span>
                                <span className="text-[11px] text-muted-foreground mt-1 leading-normal">{t('Meeting is live')}</span>
                            </div>
                            
                            <div className="flex justify-center mt-auto pt-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                    data.status === 'Started' ? 'border-emerald-500 text-emerald-500' : 'border-muted-foreground/30'
                                }`}>
                                    {data.status === 'Started' && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    )}
                                </div>
                            </div>
                        </button>

                        {/* Ended Card */}
                        <button
                            type="button"
                            onClick={() => setData('status', 'Ended')}
                            className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all cursor-pointer select-none h-full justify-between gap-3 ${
                                data.status === 'Ended'
                                    ? 'border-slate-500 bg-slate-50/50 dark:bg-slate-900/20'
                                    : 'border-border bg-background hover:bg-muted/40'
                            }`}
                        >
                            <div className="flex flex-col items-center">
                                <div className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 p-2 rounded-lg">
                                    <Check className="h-5 w-5" />
                                </div>
                                <span className="font-semibold text-sm mt-2 text-foreground">{t('Ended')}</span>
                                <span className="text-[11px] text-muted-foreground mt-1 leading-normal">{t('Meeting has ended')}</span>
                            </div>
                            
                            <div className="flex justify-center mt-auto pt-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                    data.status === 'Ended' ? 'border-slate-500 text-slate-500' : 'border-muted-foreground/30'
                                }`}>
                                    {data.status === 'Ended' && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                                    )}
                                </div>
                            </div>
                        </button>

                        {/* Cancelled Card */}
                        <button
                            type="button"
                            onClick={() => setData('status', 'Cancelled')}
                            className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all cursor-pointer select-none h-full justify-between gap-3 ${
                                data.status === 'Cancelled'
                                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                                    : 'border-border bg-background hover:bg-muted/40'
                            }`}
                        >
                            <div className="flex flex-col items-center">
                                <div className="bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 p-2 rounded-lg">
                                    <X className="h-5 w-5" />
                                </div>
                                <span className="font-semibold text-sm mt-2 text-foreground">{t('Cancelled')}</span>
                                <span className="text-[11px] text-muted-foreground mt-1 leading-normal">{t('Meeting is cancelled')}</span>
                            </div>
                            
                            <div className="flex justify-center mt-auto pt-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                    data.status === 'Cancelled' ? 'border-rose-500 text-rose-500' : 'border-muted-foreground/30'
                                }`}>
                                    {data.status === 'Cancelled' && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    )}
                                </div>
                            </div>
                        </button>
                    </div>
                    <InputError message={errors.status} />
                </div>
                
                <div>
                    <Label>{t('Participants')}</Label>
                    <MultiSelectEnhanced
                        options={users?.map((item: any) => ({ value: item.id.toString(), label: item.name })) || []}
                        value={data.participants}
                        onValueChange={(value) => setData('participants', value)}
                        placeholder={t('Select Participants...')}
                        searchable={true}
                    />
                    <InputError message={errors.participants} />
                </div>
                
                <div>
                    <Label htmlFor="host_id">{t('Host')}</Label>
                    <Select value={data.host_id?.toString() || ''} onValueChange={(value) => setData('host_id', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('Select Host')} />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((item: any) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                    {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.host_id} />
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