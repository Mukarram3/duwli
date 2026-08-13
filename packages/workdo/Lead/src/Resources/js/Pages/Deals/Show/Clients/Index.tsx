import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Trash2, Plus } from 'lucide-react';
import NoRecordsFound from '@/components/no-records-found';
import { getImagePath } from '@/utils/helpers';
import { Deal } from '../../types';
import Create from './Create';

interface ClientsProps {
    deal: Deal;
    availableClients: any[];
    onRegisterAddHandler?: (handler: () => void) => void;
}

export default function Index({ deal, availableClients, onRegisterAddHandler }: ClientsProps) {
    const { t } = useTranslation();
    const { auth } = usePage<any>().props;
    const [createOpen, setCreateOpen] = useState(false);
    const [createKey, setCreateKey] = useState(0);
    const [availableClientsState, setAvailableClientsState] = useState<{ value: string; label: string }[]>([]);
    const [deleteState, setDeleteState] = useState<{ isOpen: boolean; clientId: number | null; message: string }>({
        isOpen: false, clientId: null, message: '',
    });

    const openCreateDialog = () => {
        setAvailableClientsState(availableClients.map((c: any) => ({ value: c.id.toString(), label: c.name })));
        setCreateOpen(true);
    };

    useEffect(() => {
        onRegisterAddHandler?.(openCreateDialog);
    }, []);

    const openDeleteDialog = (clientId: number) => {
        setDeleteState({ isOpen: true, clientId, message: t('Are you sure you want to remove this client?') });
    };

    const confirmDelete = () => {
        if (deleteState.clientId) {
            router.delete(route('lead.deals.remove-client', { deal: deal.id, client: deleteState.clientId }));
            setDeleteState({ isOpen: false, clientId: null, message: '' });
        }
    };

    const clientDeals = deal.client_deals ? (Array.isArray(deal.client_deals) ? deal.client_deals : []) : [];

    return (
        <>
            <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-6">
                <h3 className="text-lg font-bold text-foreground capitalize">{t('Clients')}</h3>
                {auth?.user?.permissions?.includes('create-deal-clients') && (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={openCreateDialog}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Add Client')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            {clientDeals.length === 0 ? (
                <NoRecordsFound
                    icon={Users}
                    title={t('No Clients added')}
                    description={t('Get started by adding clients to this deal.')}
                    createPermission="create-deal-clients"
                    onCreateClick={openCreateDialog}
                    createButtonText={t('Add Clients')}
                    className="h-auto"
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto scrollbar-thin ltr:pr-1 rtl:pl-1">
                    {clientDeals.map((clientDeal: any) => (
                        <div
                            key={clientDeal.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-muted border flex items-center justify-center flex-shrink-0">
                                    {clientDeal.client?.avatar ? (
                                        <img
                                            src={getImagePath(clientDeal.client.avatar)}
                                            alt={clientDeal.client.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Users className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-sm text-foreground truncate">
                                        {clientDeal.client?.name || '-'}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {clientDeal.client?.email || ''}
                                    </p>
                                </div>
                            </div>

                            {auth?.user?.permissions?.includes('delete-deal-clients') && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDeleteDialog(clientDeal.client?.id)}
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
                <Create key={createKey} dealId={deal.id} availableClients={availableClientsState} onSuccess={() => setCreateOpen(false)} />
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={(open) => { if (!open) setDeleteState({ isOpen: false, clientId: null, message: '' }); }}
                title={t('Remove Client')}
                message={deleteState.message}
                confirmText={t('Remove')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </>
    );
}
