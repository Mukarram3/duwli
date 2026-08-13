import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { CurrencyInput } from '@/components/ui/currency-input';
import InputError from '@/components/ui/input-error';
import { RefreshCw, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/helpers';

const getRenewalStatusColor = (status: any) => {
    const statusValue = status?.toString().toLowerCase();
    switch (statusValue) {
        case 'draft':
            return 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-950/30 dark:text-slate-400 dark:ring-slate-500/20';
        case 'pending':
            return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-500/20';
        case 'approved':
            return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-500/20';
        case 'active':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-500/20';
        case 'expired':
            return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-500/20';
        case 'cancelled':
            return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-500/20';
        default:
            return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-950/30 dark:text-gray-400 dark:ring-gray-500/20';
    }
};

const getRenewalStatusText = (status: any, t: (key: string) => string) => {
    const statusValue = status?.toString().toLowerCase();
    switch (statusValue) {
        case 'draft':
            return t('Draft');
        case 'pending':
            return t('Pending');
        case 'approved':
            return t('Approved');
        case 'active':
            return t('Active');
        case 'expired':
            return t('Expired');
        case 'cancelled':
            return t('Cancelled');
        default:
            return t('Draft');
    }
};

interface RenewalsTabProps {
    contract: any;
    setDeleteConfig?: (config: any) => void;
}

export default function RenewalsTab({ contract, setDeleteConfig }: RenewalsTabProps) {
    const { t } = useTranslation();
    const { auth } = usePage<any>().props;

    const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
    const [renewalData, setRenewalData] = useState({
        start_date: '',
        end_date: '',
        value: '',
        status: 'pending',
        notes: ''
    });
    const [renewalErrors, setRenewalErrors] = useState<any>({});
    const [showRenewalId, setShowRenewalId] = useState<number | null>(null);
    const [editRenewalId, setEditRenewalId] = useState<number | null>(null);
    const [showRenewalDialogOpen, setShowRenewalDialogOpen] = useState(false);

    const handleRenewalSubmit = () => {
        setRenewalErrors({});
        const url = editRenewalId
            ? route('contract-renewals.update', editRenewalId)
            : route('contract-renewals.store', contract.id);
        const method = editRenewalId ? 'put' : 'post';

        router[method](url, renewalData, {
            onSuccess: () => {
                setRenewalDialogOpen(false);
                setRenewalData({ start_date: '', end_date: '', value: '', status: 'pending', notes: '' });
                setEditRenewalId(null);
                setRenewalErrors({});
                router.reload();
            },
            onError: (errors) => {
                setRenewalErrors(errors);
            }
        });
    };

    const getSelectedRenewal = () => {
        return contract.renewals?.find((renewal: any) => renewal.id === showRenewalId);
    };

    return (
        <>
            <Card className="border border-gray-300 dark:border-slate-700 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        {t('Contract Renewals')}
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 ms-2 text-xs font-semibold rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                            {contract.renewals?.length || 0}
                        </span>
                    </CardTitle>
                    {(auth.user?.permissions?.includes('create-contract-renewals')) && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => {
                                        setEditRenewalId(null);
                                        setRenewalData({ start_date: '', end_date: '', value: '', status: 'pending', notes: '' });
                                        setRenewalErrors({});
                                        setRenewalDialogOpen(true);
                                    }} className="h-9 w-9 p-0">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Add Renewal')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[580px] min-h-[420px] overflow-y-auto">
                        {contract.renewals && contract.renewals.length > 0 ? (
                            <Table>
                                <TableHeader className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">
                                    <TableRow>
                                        <TableHead>{t('Start Date')}</TableHead>
                                        <TableHead>{t('End Date')}</TableHead>
                                        <TableHead>{t('Value')}</TableHead>
                                        <TableHead>{t('Status')}</TableHead>
                                        <TableHead>{t('Created By')}</TableHead>
                                        <TableHead className="w-24 text-end">{t('Actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contract.renewals.map((renewal: any) => (
                                        <TableRow key={renewal.id}>
                                            <TableCell>{formatDate(renewal.start_date)}</TableCell>
                                            <TableCell>{formatDate(renewal.end_date)}</TableCell>
                                            <TableCell>{renewal.value ? formatCurrency(renewal.value) : '-'}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ring-1 ring-inset capitalize ${getRenewalStatusColor(renewal.status)}`}>
                                                    {getRenewalStatusText(renewal.status, t)}
                                                </span>
                                            </TableCell>
                                            <TableCell>{renewal.creator?.name || '-'}</TableCell>
                                            <TableCell className="text-end">
                                                <div className="flex gap-1 justify-end">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" onClick={() => {
                                                                    setShowRenewalId(renewal.id);
                                                                    setShowRenewalDialogOpen(true);
                                                                }} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{t('View Details')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    {auth.user?.permissions?.includes('edit-contract-renewals') && (renewal.creator_id === auth.user?.id || renewal.created_by === auth.user?.id) && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" onClick={() => {
                                                                        setEditRenewalId(renewal.id);
                                                                        setRenewalData({
                                                                            start_date: renewal.start_date,
                                                                            end_date: renewal.end_date,
                                                                            value: renewal.value,
                                                                            status: renewal.status,
                                                                            notes: renewal.notes || ''
                                                                        });
                                                                        setRenewalDialogOpen(true);
                                                                    }} className="h-8 w-8 p-0 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Edit')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    {auth.user?.permissions?.includes('delete-contract-renewals') && (renewal.creator_id === auth.user?.id || renewal.created_by === auth.user?.id) && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" onClick={() => {
                                                                        if (setDeleteConfig) {
                                                                            setDeleteConfig({
                                                                                type: 'renewal',
                                                                                id: renewal.id,
                                                                                route: 'contract-renewals.destroy',
                                                                                message: t('Are you sure you want to delete this renewal?')
                                                                            });
                                                                        } else {
                                                                            if (confirm(t('Are you sure you want to delete this renewal?'))) {
                                                                                router.delete(route('contract-renewals.destroy', renewal.id));
                                                                            }
                                                                        }
                                                                    }} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Delete')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12">
                                <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">{t('No renewals yet')}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editRenewalId ? t('Edit Contract Renewal') : t('Add Contract Renewal')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 my-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label required>{t('Start Date')}</Label>
                                <DatePicker
                                    value={renewalData.start_date}
                                    onChange={(value) => setRenewalData({ ...renewalData, start_date: value })}
                                    placeholder={t('Select Start Date')}
                                    required
                                />
                                <InputError message={renewalErrors.start_date} />
                            </div>
                            <div>
                                <Label required>{t('End Date')}</Label>
                                <DatePicker
                                    value={renewalData.end_date}
                                    onChange={(value) => setRenewalData({ ...renewalData, end_date: value })}
                                    placeholder={t('Select End Date')}
                                    required
                                />
                                <InputError message={renewalErrors.end_date} />
                            </div>
                        </div>
                        <div>
                            <CurrencyInput
                                label={t('Value')}
                                value={renewalData.value}
                                onChange={(value) => setRenewalData({ ...renewalData, value: value })}
                                error={renewalErrors.value}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="status" required>{t('Status')}</Label>
                            <Select value={renewalData.status} onValueChange={(value) => setRenewalData({ ...renewalData, status: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-gray-600" />
                                            {t('Draft')}
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-yellow-600" />
                                            {t('Pending')}
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="approved">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                                            {t('Approved')}
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="active">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-600" />
                                            {t('Active')}
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="expired">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-orange-600" />
                                            {t('Expired')}
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-600" />
                                            {t('Cancelled')}
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={renewalErrors.status} />
                        </div>
                        <div>
                            <Label htmlFor="notes">{t('Notes')}</Label>
                            <Textarea
                                id="notes"
                                value={renewalData.notes}
                                onChange={(e) => setRenewalData({ ...renewalData, notes: e.target.value })}
                                placeholder={t('Enter Notes')}
                                rows={3}
                            />
                            <InputError message={renewalErrors.notes} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setRenewalDialogOpen(false);
                            setEditRenewalId(null);
                            setRenewalData({ start_date: '', end_date: '', value: '', status: 'draft', notes: '' });
                            setRenewalErrors({});
                        }}>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={handleRenewalSubmit}>
                            {editRenewalId ? t('Update') : t('Create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showRenewalDialogOpen} onOpenChange={setShowRenewalDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            {t('Renewal Details')}
                        </DialogTitle>
                    </DialogHeader>
                    {getSelectedRenewal() && (
                        <div className="space-y-4 my-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">{t('Start Date')}</Label>
                                    <p className="text-sm mt-1">{formatDate(getSelectedRenewal().start_date)}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">{t('End Date')}</Label>
                                    <p className="text-sm mt-1">{formatDate(getSelectedRenewal().end_date)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">{t('Value')}</Label>
                                    <p className="text-sm mt-1">{getSelectedRenewal().value ? formatCurrency(getSelectedRenewal().value) : '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">{t('Status')}</Label>
                                    <div className="mt-1">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ring-1 ring-inset capitalize ${getRenewalStatusColor(getSelectedRenewal().status)}`}>
                                            {getRenewalStatusText(getSelectedRenewal().status, t)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">{t('Created By')}</Label>
                                <p className="text-sm mt-1">{getSelectedRenewal().creator?.name || '-'}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">{t('Created At')}</Label>
                                <p className="text-sm mt-1">{formatDateTime(getSelectedRenewal().created_at)}</p>
                            </div>
                            {getSelectedRenewal().notes && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">{t('Notes')}</Label>
                                    <div className="mt-1 bg-gray-50 rounded-lg p-3">
                                        <p className="text-sm text-gray-700">{getSelectedRenewal().notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowRenewalDialogOpen(false);
                            setShowRenewalId(null);
                        }}>
                            {t('Close')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}