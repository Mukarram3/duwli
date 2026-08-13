import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, PhoneOutgoing, PhoneIncoming, Clock, User, Edit, Trash2, Plus } from 'lucide-react';
import NoRecordsFound from '@/components/no-records-found';
import { formatTime, getImagePath } from '@/utils/helpers';
import { Lead } from '../../types';
import { LeadCall } from './types';
import Create from './Create';
import EditCall from './Edit';

interface CallsProps {
    lead: Lead;
}

export default function Index({ lead }: CallsProps) {
    const { t } = useTranslation();
    const { auth } = usePage<any>().props;
    const [createOpen, setCreateOpen] = useState(false);
    const [createKey, setCreateKey] = useState(0);
    const [editingCall, setEditingCall] = useState<LeadCall | null>(null);
    const [editKey, setEditKey] = useState(0);
    const [deleteState, setDeleteState] = useState<{ isOpen: boolean; callId: number | null; message: string }>({
        isOpen: false, callId: null, message: '',
    });

    const openDeleteDialog = (callId: number) => {
        setDeleteState({ isOpen: true, callId, message: t('Are you sure you want to delete this call?') });
    };

    const confirmDelete = () => {
        if (deleteState.callId) {
            router.delete(route('lead.calls.destroy', deleteState.callId));
            setDeleteState({ isOpen: false, callId: null, message: '' });
        }
    };

    const canAdd = auth?.user?.permissions?.includes('edit-leads');

    const outboundCalls = (lead.calls || [])
        .filter((call: LeadCall) => call.call_type === 'Outbound')
        .sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id;
            return timeB - timeA;
        });

    const inboundCalls = (lead.calls || [])
        .filter((call: LeadCall) => call.call_type === 'Inbound')
        .sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id;
            return timeB - timeA;
        });

    const renderCallCard = (call: LeadCall) => {
        const userLead = lead.user_leads?.find((ul: any) => ul.user?.id === call.user_id);
        const assignee = userLead?.user;
        const assigneeName = assignee?.name || '-';
        const assigneeEmail = assignee?.email || '';
        const assigneeAvatar = assignee?.avatar ? getImagePath(assignee.avatar) : null;
        
        return (
            <div
                key={call.id}
                className="flex flex-col p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200"
            >
                {/* Top Row: Icon + Subject + Badge & Actions */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            call.call_type === 'Inbound'
                                ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                                : 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400'
                        }`}>
                            {call.call_type === 'Inbound' ? (
                                <PhoneIncoming className="w-5 h-5" />
                            ) : (
                                <PhoneOutgoing className="w-5 h-5" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm text-foreground truncate" title={call.subject}>
                                    {call.subject}
                                </h4>
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                    call.call_type === 'Inbound'
                                        ? 'bg-green-500/10 text-green-700 dark:text-green-400 ring-green-600/20 dark:ring-green-500/30'
                                        : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-500/30'
                                }`}>
                                    {t(call.call_type)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        <TooltipProvider>
                            {auth?.user?.permissions?.includes('edit-lead-calls') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setEditingCall(call); setEditKey(k => k + 1); }}
                                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                </Tooltip>
                            )}
                            {auth?.user?.permissions?.includes('delete-lead-calls') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openDeleteDialog(call.id)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                </Tooltip>
                            )}
                        </TooltipProvider>
                    </div>
                </div>

                {/* Middle Row: Description & Call Result */}
                <div className="my-3 min-h-[40px]">
                    {call.description ? (
                        <div 
                            className="text-xs text-muted-foreground break-words line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: call.description }}
                        />
                    ) : (
                        <p className="text-xs text-muted-foreground italic">
                            {t('No description provided')}
                        </p>
                    )}
                    {call.call_result && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/30 p-1.5 rounded-md border border-border/40">
                            <span className="font-semibold text-foreground flex-shrink-0 mt-0.5">{t('Result')}:</span>
                            <div 
                                className="flex-1 max-h-24 overflow-y-auto scrollbar-thin break-words"
                                dangerouslySetInnerHTML={{ __html: call.call_result }}
                            />
                        </div>
                    )}
                </div>

                {/* Bottom Row: Assignee Info & Duration */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-border mt-auto">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border flex items-center justify-center flex-shrink-0">
                            {assigneeAvatar ? (
                                <img
                                    src={assigneeAvatar}
                                    alt={assigneeName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-4 h-4 text-muted-foreground" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-xs text-foreground truncate">{assigneeName}</p>
                            {assigneeEmail && (
                                <p className="text-[10px] text-muted-foreground truncate">{assigneeEmail}</p>
                            )}
                        </div>
                    </div>

                    {call.duration && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20 flex-shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTime(call.duration)}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-6">
                <h3 className="text-lg font-bold text-foreground capitalize">{t('Calls')}</h3>
                {auth?.user?.permissions?.includes('create-lead-calls') && (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={() => { setCreateKey(k => k + 1); setCreateOpen(true); }}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Create')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            {(!lead.calls || lead.calls.length === 0) ? (
                <NoRecordsFound
                    icon={Phone}
                    title={t('No Calls found')}
                    description={t('Get started by adding your first call.')}
                    createPermission="create-lead-calls"
                    onCreateClick={() => { setCreateKey(k => k + 1); setCreateOpen(true); }}
                    createButtonText={t('Create Call')}
                    className="h-auto"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Outbound Column Card */}
                    <div className="bg-card border border-border shadow-md rounded-xl p-5 flex flex-col">
                        <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-4">
                            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <span>{t('Outbound')}</span>
                                <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-semibold">
                                    {outboundCalls.length}
                                </span>
                            </h4>
                        </div>
                        <div className="space-y-4 h-[480px] overflow-y-auto scrollbar-thin ltr:pr-1 rtl:pl-1">
                            {outboundCalls.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground/60 text-xs py-8 border border-dashed rounded-xl bg-muted/5">
                                    {t('No outbound calls')}
                                </div>
                            ) : (
                                outboundCalls.map((call) => renderCallCard(call))
                            )}
                        </div>
                    </div>

                    {/* Inbound Column Card */}
                    <div className="bg-card border border-border shadow-md rounded-xl p-5 flex flex-col">
                        <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-4">
                            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <span>{t('Inbound')}</span>
                                <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-semibold">
                                    {inboundCalls.length}
                                </span>
                            </h4>
                        </div>
                        <div className="space-y-4 h-[480px] overflow-y-auto scrollbar-thin ltr:pr-1 rtl:pl-1">
                            {inboundCalls.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground/60 text-xs py-8 border border-dashed rounded-xl bg-muted/5">
                                    {t('No inbound calls')}
                                </div>
                            ) : (
                                inboundCalls.map((call) => renderCallCard(call))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setCreateKey(k => k + 1); setCreateOpen(open); }}>
                <Create key={createKey} leadId={lead.id} userLeads={lead.user_leads || []} onSuccess={() => setCreateOpen(false)} />
            </Dialog>

            <Dialog open={!!editingCall} onOpenChange={(open) => { if (!open) setEditingCall(null); }}>
                {editingCall && (
                    <EditCall key={editKey} call={editingCall} userLeads={lead.user_leads || []} onSuccess={() => setEditingCall(null)} />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={(open) => { if (!open) setDeleteState({ isOpen: false, callId: null, message: '' }); }}
                title={t('Delete Call')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </>
    );
}
