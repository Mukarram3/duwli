import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users as UsersIcon, Trash2, Plus } from 'lucide-react';
import NoRecordsFound from '@/components/no-records-found';
import { getImagePath } from '@/utils/helpers';
import { Lead } from '../../types';
import Create from './Create';

interface UsersProps {
    lead: Lead;
    onRegisterAddHandler?: (handler: () => void) => void;
}

export default function Index({ lead }: UsersProps) {
    const { t } = useTranslation();
    const { auth } = usePage<any>().props;
    const [createOpen, setCreateOpen] = useState(false);
    const [createKey, setCreateKey] = useState(0);
    const [availableUsers, setAvailableUsers] = useState<{ value: string; label: string }[]>([]);
    const [deleteState, setDeleteState] = useState<{ isOpen: boolean; userId: number | null; message: string }>({
        isOpen: false, userId: null, message: '',
    });

    const openCreateDialog = async () => {
        try {
            const res = await fetch(route('lead.leads.available-users', lead.id));
            const users = await res.json();
            setAvailableUsers(users.map((u: any) => ({ value: u.id.toString(), label: u.name })));
        } catch {}
        setCreateOpen(true);
    };

    const openDeleteDialog = (userId: number) => {
        setDeleteState({ isOpen: true, userId, message: t('Are you sure you want to delete this user?') });
    };

    const confirmDelete = () => {
        if (deleteState.userId) {
            router.delete(route('lead.leads.remove-user', { lead: lead.id, user: deleteState.userId }));
            setDeleteState({ isOpen: false, userId: null, message: '' });
        }
    };

    return (
        <>
            <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-6">
                <h3 className="text-lg font-bold text-foreground capitalize">{t('Users')}</h3>
                {auth?.user?.permissions?.includes('create-lead-users') && (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={openCreateDialog}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Add User')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            {(lead.user_leads || []).length === 0 ? (
                <NoRecordsFound
                    icon={UsersIcon}
                    title={t('No Users added')}
                    description={t('Get started by adding users to this lead.')}
                    createPermission="create-lead-users"
                    onCreateClick={openCreateDialog}
                    createButtonText={t('Add Users')}
                    className="h-auto"
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto scrollbar-thin ltr:pr-1 rtl:pl-1">
                    {(lead.user_leads || []).map((userLead: any) => (
                        <div
                            key={userLead.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-muted border flex items-center justify-center flex-shrink-0">
                                    {userLead.user?.avatar ? (
                                        <img
                                            src={getImagePath(userLead.user.avatar)}
                                            alt={userLead.user.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <UsersIcon className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-sm text-foreground truncate">
                                        {userLead.user?.name || '-'}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {userLead.user?.email || ''}
                                    </p>
                                </div>
                            </div>

                            {auth?.user?.permissions?.includes('delete-lead-users') && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDeleteDialog(userLead.user?.id)}
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setCreateKey(k => k + 1); setCreateOpen(open); }}>
                <Create key={createKey} leadId={lead.id} availableUsers={availableUsers} onSuccess={() => setCreateOpen(false)} />
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={(open) => { if (!open) setDeleteState({ isOpen: false, userId: null, message: '' }); }}
                title={t('Delete User')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </>
    );
}
