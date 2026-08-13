import { useState, useEffect } from 'react';
import { Head, usePage, router, Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { usePageButtons } from '@/hooks/usePageButtons';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { FileText, Calendar, User, DollarSign, Edit, Paperclip, MessageSquare, StickyNote, RefreshCw, PenTool, Eye, CheckCircle, Save, X } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Contract, ContractShowProps } from './types';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/helpers';

const getContractStatusColor = (status: any) => {
    const statusValue = status?.toString().toLowerCase();
    switch (statusValue) {
        case 'pending':
        case 'draft':
            return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-500/20';
        case 'accepted':
        case 'active':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-500/20';
        case 'expired':
            return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-500/20';
        case 'declined':
            return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-500/20';
        case 'closed':
            return 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-950/30 dark:text-slate-400 dark:ring-slate-500/20';
        case 'archived':
            return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-950/30 dark:text-gray-400 dark:ring-gray-500/20';
        default:
            return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-500/20';
    }
};

const getContractStatusText = (status: any, t: (key: string) => string) => {
    const statusValue = status?.toString().toLowerCase();
    switch (statusValue) {
        case 'pending':
            return t('Pending');
        case 'accepted':
            return t('Accepted');
        case 'declined':
            return t('Declined');
        case 'closed':
            return t('Closed');
        case 'draft':
            return t('Draft');
        case 'active':
            return t('Active');
        case 'archived':
            return t('Archived');
        default:
            return t('Pending');
    }
};
import AttachmentsTab from './components/AttachmentsTab';
import CommentsTab from './components/CommentsTab';
import NotesTab from './components/NotesTab';
import RenewalsTab from './components/RenewalsTab';
import SignatureModal from './components/SignatureModal';
import ContractPDFExport from './components/ContractPDFExport';

export default function Show() {
    const { t } = useTranslation();
    const { contract, auth } = usePage<ContractShowProps>().props;


    const [activeTab, setActiveTab] = useState('details');
    const [deleteConfig, setDeleteConfig] = useState<{ type: string, id: number, route: string, message: string } | null>(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    const { data, setData, put, processing } = useForm({
        subject: contract.subject,
        user_id: contract.user?.id || '',
        value: contract.value || '',
        type_id: contract.contract_type?.id || '',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        description: contract.description || '',
        status: contract.status || 'pending'
    });

    const spreadsheetButtons = usePageButtons('spreadsheetBtn', { module: 'Contract', sub_module: contract.subject });
    const businessProcessMappingButtons = usePageButtons('businessProcessMappingBtn', { module: 'Contract', submodule: 'Contract', id: contract.id });

    const handleDeleteConfirm = () => {
        if (deleteConfig) {
            router.delete(route(deleteConfig.route, deleteConfig.id), {
                onSuccess: () => router.reload()
            });
            setDeleteConfig(null);
        }
    };

    const handleSaveDescription = () => {
        put(route('contract.update', contract.id), {
            onSuccess: () => {
                setIsEditingDescription(false);
                router.reload();
            }
        });
    };

    const handleCancelEdit = () => {
        setData({
            subject: contract.subject,
            user_id: contract.user?.id || '',
            value: contract.value || '',
            type_id: contract.contract_type?.id || '',
            start_date: contract.start_date || '',
            end_date: contract.end_date || '',
            description: contract.description || '',
            status: contract.status || 'pending'
        });
        setIsEditingDescription(false);
    };

    const getProgress = () => {
        if (!contract.start_date || !contract.end_date) return 0;
        const start = new Date(contract.start_date).getTime();
        const end = new Date(contract.end_date).getTime();
        const now = new Date().getTime();
        if (now < start) return 0;
        if (now > end) return 100;
        const total = end - start;
        const elapsed = now - start;
        return Math.round((elapsed / total) * 100);
    };

    // Permission checks for tabs
    const canViewAttachments = auth.user?.permissions?.includes('manage-any-contract-attachments') || auth.user?.permissions?.includes('manage-own-contract-attachments');
    const canViewComments = auth.user?.permissions?.includes('manage-any-contract-comments') || auth.user?.permissions?.includes('manage-own-contract-comments');
    const canViewNotes = auth.user?.permissions?.includes('manage-any-contract-notes') || auth.user?.permissions?.includes('manage-own-contract-notes');
    const canViewRenewals = auth.user?.permissions?.includes('manage-any-contract-renewals') || auth.user?.permissions?.includes('manage-own-contract-renewals');

    // Calculate visible tabs count for grid layout
    const visibleTabsCount = 1 + (canViewAttachments ? 1 : 0) + (canViewComments ? 1 : 0) + (canViewNotes ? 1 : 0) + (canViewRenewals ? 1 : 0);

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Contract'), url: route('contract.index') },
                { label: contract.contract_number }
            ]}
            pageTitle={t('Details Contract')}
            pageDescription={t('View details, items, signature state, attachments, comments, and renewals for this contract.')}
            backUrl={route('contract.index')}
            pageActions={
                <TooltipProvider>
                    <div className="flex gap-2">
                        {spreadsheetButtons.map((button) => (
                            <div key={button.id}>
                                {button.component}
                            </div>
                        ))}
                        {businessProcessMappingButtons.map((button) => (
                            <div key={button.id}>
                                {button.component}
                            </div>
                        ))}

                        {auth.user?.permissions?.includes('preview-contracts') && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(route('contract.preview', contract.id))}
                                    >
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Preview')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        <ContractPDFExport contract={contract} />

                        {!contract.signatures?.some(sig => sig.user.id === auth.user?.id) && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowSignatureModal(true)}
                                    >
                                        <PenTool className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Signature Contract')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}


                    </div>
                </TooltipProvider>
            }
        >
            <Head title={`${t('Details Contract')} - ${contract.subject}`} />

            <div className="space-y-6">
                {/* Modern Glassmorphic Header Card */}
                <Card className="border border-gray-300 dark:border-slate-700 shadow-md bg-gradient-to-br from-white to-gray-50/40 dark:from-slate-900 dark:to-slate-950/40 overflow-hidden">
                    <CardHeader className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            {/* Left Side: Icon & Details */}
                            <div className="flex items-start gap-4">
                                <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-2xl shadow-sm text-primary flex-shrink-0">
                                    <FileText className="h-7 w-7" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{contract.subject}</h1>
                                        {contract.contract_type?.name && (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/45 dark:text-blue-450 dark:border-blue-800">
                                                {contract.contract_type.name}
                                            </span>
                                        )}
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ring-1 ring-inset capitalize ${getContractStatusColor(contract.status)}`}>
                                            {getContractStatusText(contract.status, t)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-mono text-xs bg-gray-105 dark:bg-slate-800 px-2 py-0.5 rounded border dark:border-slate-700">{contract.contract_number}</span>
                                        {contract.user?.name && (
                                            <span className="flex items-center gap-1.5">
                                                <User className="h-4 w-4 text-gray-450" />
                                                {contract.user.name}
                                            </span>
                                        )}
                                        {contract.created_at && (
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="h-4 w-4 text-gray-450" />
                                                {formatDate(contract.created_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Contract Value High-contrast block */}
                            <div className="flex-shrink-0 lg:text-end">
                                <div className="inline-flex items-center gap-4 bg-white/70 dark:bg-slate-900/60 border border-gray-205 dark:border-slate-800 p-4 rounded-2xl shadow-inner min-w-[200px]">
                                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <div className="text-start">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Contract Value')}</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white leading-none mt-1">
                                            {contract.value ? formatCurrency(contract.value) : (
                                                <span className="text-sm text-gray-400 font-normal">{t('Not Set')}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Two-Column Grid Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (9 grid columns): Tabs and Content */}
                    <div className="lg:col-span-9 space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className={`flex w-full overflow-x-auto whitespace-nowrap bg-gray-100/80 dark:bg-slate-900 p-1 rounded-xl justify-start gap-1 md:grid md:grid-cols-${visibleTabsCount} h-auto md:h-11 scrollbar-none`}>
                                <TabsTrigger value="details" className="flex-shrink-0 md:flex-shrink-1 flex items-center justify-center gap-2 rounded-lg py-2 transition-all">
                                    <FileText className="h-4 w-4" />
                                    <span>{t('Details')}</span>
                                </TabsTrigger>
                                {canViewAttachments && (
                                    <TabsTrigger value="attachments" className="flex-shrink-0 md:flex-shrink-1 flex items-center justify-center gap-2 rounded-lg py-2 transition-all">
                                        <Paperclip className="h-4 w-4" />
                                        <span>{t('Attachments')} ({contract.attachments?.length || 0})</span>
                                    </TabsTrigger>
                                )}
                                {canViewComments && (
                                    <TabsTrigger value="comments" className="flex-shrink-0 md:flex-shrink-1 flex items-center justify-center gap-2 rounded-lg py-2 transition-all">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>{t('Comments')} ({contract.comments?.length || 0})</span>
                                    </TabsTrigger>
                                )}
                                {canViewNotes && (
                                    <TabsTrigger value="notes" className="flex-shrink-0 md:flex-shrink-1 flex items-center justify-center gap-2 rounded-lg py-2 transition-all">
                                        <StickyNote className="h-4 w-4" />
                                        <span>{t('Notes')} ({contract.notes?.length || 0})</span>
                                    </TabsTrigger>
                                )}
                                {canViewRenewals && (
                                    <TabsTrigger value="renewals" className="flex-shrink-0 md:flex-shrink-1 flex items-center justify-center gap-2 rounded-lg py-2 transition-all">
                                        <RefreshCw className="h-4 w-4" />
                                        <span>{t('Renewals')} ({contract.renewals?.length || 0})</span>
                                    </TabsTrigger>
                                )}
                            </TabsList>

                            {/* Details Tab Content: Beautiful Contract Document and Signatures */}
                            <TabsContent value="details" className="mt-6 space-y-6">
                                <Card className="border border-gray-300 dark:border-slate-700 shadow-md overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10 p-5">
                                        <CardTitle className="text-base font-bold text-gray-855 dark:text-gray-200 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            {t('Contract Agreement')}
                                        </CardTitle>
                                        {auth.user?.permissions?.includes('edit-contracts') && (
                                            <div className="flex gap-2">
                                                {isEditingDescription ? (
                                                    <>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="sm" onClick={handleSaveDescription} disabled={processing} className="h-8 px-3">
                                                                    <Save className="h-4 w-4 me-1.5" />
                                                                    {t('Save')}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('Save changes')}</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 px-3">
                                                                    <X className="h-4 w-4 me-1.5" />
                                                                    {t('Cancel')}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('Discard changes')}</p></TooltipContent>
                                                        </Tooltip>
                                                    </>
                                                ) : (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button size="sm" variant="outline" onClick={() => setIsEditingDescription(true)} className="h-8 px-3 border-gray-200 dark:border-gray-805">
                                                                <Edit className="h-4 w-4 me-1.5 text-gray-500" />
                                                                {t('Edit Document')}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>{t('Edit contract body')}</p></TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {isEditingDescription ? (
                                            <RichTextEditor
                                                key={`editor-${contract.id}-${isEditingDescription}`}
                                                content={data.description}
                                                onChange={(value) => setData('description', value)}
                                                placeholder={t('Enter description...')}
                                            />
                                        ) : (
                                            <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-6 min-h-[180px] max-h-[280px] overflow-y-auto shadow-inner max-w-none prose prose-indigo dark:prose-invert pe-3">
                                                {contract.description ? (
                                                    <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-normal" dangerouslySetInnerHTML={{ __html: contract.description }} />
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic text-center py-12">{t('No description or agreement text provided.')}</p>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Signature Block */}
                                {contract.signatures && contract.signatures.length > 0 && (
                                    <Card className="border border-gray-300 dark:border-slate-700 shadow-md overflow-hidden">
                                        <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10 p-5">
                                            <CardTitle className="text-base font-bold text-gray-808 dark:text-gray-200 flex items-center gap-2">
                                                <PenTool className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                {t('Signatures')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {contract.signatures.map((signature, index) => (
                                                    <div key={signature.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50/60 dark:bg-slate-905/60 hover:shadow-sm transition-all duration-300">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/55 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                                                <CheckCircle className="h-5 w-5" />
                                                            </div>
                                                            <div className="flex-1 space-y-2">
                                                                <div>
                                                                    <p className="font-semibold text-sm text-gray-850 dark:text-gray-205">{signature.user.name}</p>
                                                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                                                        {t('Signed on')} {formatDateTime(signature.signed_at)}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-inner flex items-center justify-center max-w-[200px]">
                                                                    <img
                                                                        src={signature.signature_data}
                                                                        alt="Signature"
                                                                        className="max-h-12 object-contain"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Subtabs Content */}
                            {canViewAttachments && (
                                <TabsContent value="attachments" className="mt-6">
                                    <AttachmentsTab contract={contract} setDeleteConfig={setDeleteConfig} />
                                </TabsContent>
                            )}

                            {canViewComments && (
                                <TabsContent value="comments" className="mt-6">
                                    <CommentsTab contract={contract} setDeleteConfig={setDeleteConfig} />
                                </TabsContent>
                            )}

                            {canViewNotes && (
                                <TabsContent value="notes" className="mt-6">
                                    <NotesTab contract={contract} setDeleteConfig={setDeleteConfig} />
                                </TabsContent>
                            )}

                            {canViewRenewals && (
                                <TabsContent value="renewals" className="mt-6">
                                    <RenewalsTab contract={contract} setDeleteConfig={setDeleteConfig} />
                                </TabsContent>
                            )}
                        </Tabs>
                    </div>

                    {/* Right Column (3 grid columns): Permanent Sidebar Info */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="border border-gray-300 dark:border-slate-700 shadow-md overflow-hidden sticky top-6">
                            <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10 p-5">
                                <CardTitle className="text-base font-bold text-gray-805 dark:text-gray-200">
                                    {t('Contract Information')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-5">
                                {/* Status Selection Box */}
                                <div className="space-y-2">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block">{t('Status')}</span>
                                    {auth.user?.permissions?.includes('edit-contracts') ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between items-center text-sm font-medium hover:bg-gray-50 border-gray-200 dark:border-gray-800 dark:hover:bg-gray-900 h-10 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${contract.status === 'pending' ? 'bg-yellow-500' :
                                                            contract.status === 'accepted' ? 'bg-green-500' :
                                                                contract.status === 'declined' ? 'bg-red-500' :
                                                                    contract.status === 'closed' ? 'bg-gray-500' :
                                                                        'bg-blue-500'
                                                            }`} />
                                                        {getContractStatusText(contract.status, t)}
                                                    </div>
                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900 border dark:border-gray-800 shadow-lg">
                                                <DropdownMenuItem
                                                    onClick={() => router.patch(route('contract.update-status', contract.id), { status: 'pending' })}
                                                    className="flex items-center gap-2 cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-950/20 focus:bg-yellow-50 dark:focus:bg-yellow-950/20 py-2.5"
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-yellow-600" />
                                                    {t('Pending')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => router.patch(route('contract.update-status', contract.id), { status: 'accepted' })}
                                                    className="flex items-center gap-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/20 focus:bg-green-50 dark:focus:bg-green-950/20 py-2.5"
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-green-600" />
                                                    {t('Accepted')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => router.patch(route('contract.update-status', contract.id), { status: 'declined' })}
                                                    className="flex items-center gap-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 focus:bg-red-50 dark:focus:bg-red-950/20 py-2.5"
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-red-600" />
                                                    {t('Declined')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => router.patch(route('contract.update-status', contract.id), { status: 'closed' })}
                                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-950/20 focus:bg-gray-50 dark:focus:bg-gray-950/20 py-2.5"
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-gray-600" />
                                                    {t('Closed')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-lg text-sm font-medium">
                                            <div className={`w-2.5 h-2.5 rounded-full ${contract.status === 'pending' ? 'bg-yellow-500' :
                                                contract.status === 'accepted' ? 'bg-green-500' :
                                                    contract.status === 'declined' ? 'bg-red-500' :
                                                        contract.status === 'closed' ? 'bg-gray-500' :
                                                            'bg-blue-500'
                                                }`} />
                                            {getContractStatusText(contract.status, t)}
                                        </div>
                                    )}
                                </div>

                                {/* Metadata Cards/Lists */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50/60 dark:bg-slate-900/60 border border-gray-150/60 dark:border-slate-800 rounded-xl">
                                        <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg flex-shrink-0">
                                            <span className="text-sm font-mono font-bold">#</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Contract Number')}</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-mono truncate mt-0.5">{contract.contract_number || t('Not Generated')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-gray-50/60 dark:bg-slate-900/60 border border-gray-150/60 dark:border-slate-800 rounded-xl">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-lg flex-shrink-0">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Client')}</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate mt-0.5">{contract.user?.name || t('Not Assigned')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-gray-50/60 dark:bg-slate-900/60 border border-gray-150/60 dark:border-slate-800 rounded-xl">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg flex-shrink-0">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Contract Type')}</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate mt-0.5">{contract.contract_type?.name || t('Not Set')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-gray-50/60 dark:bg-slate-900/60 border border-gray-150/60 dark:border-slate-800 rounded-xl">
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg flex-shrink-0">
                                            <DollarSign className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Contract Value')}</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate mt-0.5">{contract.value ? formatCurrency(contract.value) : t('Not Set')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline and Progress */}
                                <div className="p-4 bg-gray-50/60 dark:bg-slate-900/60 border border-gray-150/60 dark:border-slate-800 rounded-xl space-y-4">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block">{t('Timeline & Progress')}</span>
                                    
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400 dark:text-gray-500">{t('Duration')}</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                                            {contract.start_date && contract.end_date ?
                                                `${Math.ceil((new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime()) / (1000 * 60 * 60 * 24))} ${t('days')}`
                                                : t('Not Calculated')
                                            }
                                        </span>
                                    </div>

                                    {contract.start_date && contract.end_date && (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                                                <span>{t('Elapsed Progress')}</span>
                                                <span>{getProgress()}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                                    style={{ width: `${getProgress()}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200/50 dark:border-slate-800">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Start Date')}</p>
                                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{contract.start_date ? formatDate(contract.start_date) : t('Not Set')}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('End Date')}</p>
                                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{contract.end_date ? formatDate(contract.end_date) : t('Not Set')}</p>
                                        </div>
                                    </div>

                                    {contract.created_at && (
                                        <div className="pt-3 border-t border-gray-200/50 dark:border-slate-800 flex justify-between items-center text-xs">
                                            <span className="text-gray-400 dark:text-gray-500">{t('Created')}</span>
                                            <span className="font-medium text-gray-600 dark:text-gray-400">{formatDateTime(contract.created_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <ConfirmationDialog
                open={!!deleteConfig}
                onOpenChange={() => setDeleteConfig(null)}
                title={t(`Delete ${deleteConfig?.type || ''}`)}
                message={deleteConfig?.message || ''}
                confirmText={t('Delete')}
                onConfirm={handleDeleteConfirm}
                variant="destructive"
            />

            <SignatureModal
                open={showSignatureModal}
                onOpenChange={setShowSignatureModal}
                contractId={contract.id}
            />
        </AuthenticatedLayout>
    );
}
