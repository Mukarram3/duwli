import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, Trash2, Plus } from 'lucide-react';
import NoRecordsFound from '@/components/no-records-found';
import { Lead } from '../../types';
import Create from './Create';

interface SourcesProps {
    lead: Lead;
}

export default function Index({ lead }: SourcesProps) {
    const { t } = useTranslation();
    const { auth, sourceItems } = usePage<any>().props;
    const sourceItemsList: { id: number; name: string }[] = sourceItems || [];
    const [createOpen, setCreateOpen] = useState(false);
    const [createKey, setCreateKey] = useState(0);
    const [availableSources, setAvailableSources] = useState<{ value: string; label: string }[]>([]);
    const [deleteState, setDeleteState] = useState<{ isOpen: boolean; sourceId: string | null; message: string }>({
        isOpen: false, sourceId: null, message: '',
    });

    const openCreateDialog = async () => {
        try {
            const res = await fetch(route('lead.leads.available-sources', lead.id));
            const sources = await res.json();
            setAvailableSources(sources.map((s: any) => ({ value: s.id.toString(), label: s.name })));
        } catch {}
        setCreateOpen(true);
    };

    const openDeleteDialog = (sourceId: string) => {
        setDeleteState({ isOpen: true, sourceId, message: t('Are you sure you want to delete this source?') });
    };

    const confirmDelete = () => {
        if (deleteState.sourceId) {
            router.delete(route('lead.leads.remove-source', { lead: lead.id, source: deleteState.sourceId }));
            setDeleteState({ isOpen: false, sourceId: null, message: '' });
        }
    };

    return (
        <>
            <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-6">
                <h3 className="text-lg font-bold text-foreground capitalize">{t('Sources')}</h3>
                {auth?.user?.permissions?.includes('create-lead-sources') && (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={openCreateDialog}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Add Source')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            {sourceItemsList.length === 0 ? (
                <NoRecordsFound
                    icon={Database}
                    title={t('No Sources added')}
                    description={t('Get started by adding sources to this lead.')}
                    createPermission="create-lead-sources"
                    onCreateClick={openCreateDialog}
                    createButtonText={t('Add Sources')}
                    className="h-auto"
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto scrollbar-thin ltr:pr-1 rtl:pl-1">
                    {sourceItemsList.map((source) => (
                        <div
                            key={source.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-muted border flex items-center justify-center flex-shrink-0">
                                    <Database className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-sm text-foreground truncate">
                                        {source.name || '-'}
                                    </h4>
                                </div>
                            </div>

                            {auth?.user?.permissions?.includes('delete-lead-sources') && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDeleteDialog(source.id.toString())}
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
                <Create key={createKey} leadId={lead.id} availableSources={availableSources} onSuccess={() => setCreateOpen(false)} />
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={(open) => { if (!open) setDeleteState({ isOpen: false, sourceId: null, message: '' }); }}
                title={t('Delete Source')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </>
    );
}
