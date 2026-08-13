import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { User, Building, Calendar, FileText, Download, CheckCircle2, XCircle, Ban, ArrowRightLeft } from 'lucide-react';
import { EmployeeTransfer } from './types';
import { formatDate, getImagePath } from '@/utils/helpers';

const getStatusBadge = (status: string, t: any) => {
    switch (status?.toLowerCase()) {
        case 'approved':
            return (
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                    {t('Approved')}
                </span>
            );
        case 'in progress':
            return (
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                    {t('In Progress')}
                </span>
            );
        case 'rejected':
            return (
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20">
                    {t('Rejected')}
                </span>
            );
        case 'cancelled':
            return (
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20">
                    {t('Cancelled')}
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                    {t('Pending')}
                </span>
            );
    }
};

interface ViewProps {
    employeetransfer: EmployeeTransfer;
}

export default function View({ employeetransfer }: ViewProps) {
    const { t } = useTranslation();

    return (
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <ArrowRightLeft className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {t('Employee Transfer Details')}
                            </DialogTitle>
                        </div>
                    </div>
                    <div>
                        {getStatusBadge(employeetransfer.status || 'pending', t)}
                    </div>
                </div>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
                {/* Employee Info Box */}
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 flex items-center justify-center flex-shrink-0">
                            {employeetransfer.employee?.avatar ? (
                                <img src={getImagePath(employeetransfer.employee.avatar)} alt={employeetransfer.employee.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                                {employeetransfer.employee?.name || '-'}
                            </h3>
                            {employeetransfer.employee?.email && (
                                <p className="text-xs text-muted-foreground">{employeetransfer.employee.email}</p>
                            )}
                        </div>
                    </div>

                    {/* Rejected Stamp inside Employee Card when Rejected */}
                    {employeetransfer.status?.toLowerCase() === 'rejected' && (
                        <div className="flex-shrink-0 relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-red-600 dark:border-red-400 p-0.5 bg-red-100/40 dark:bg-red-950/40 rotate-[-12deg] shadow-sm select-none">
                            <div className="w-full h-full rounded-full border border-dashed border-red-600 dark:border-red-400 flex flex-col items-center justify-center p-1 text-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px]">
                                <div className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                                    <span className="text-[6px]">★</span>
                                    <XCircle className="w-3 h-3" />
                                    <span className="text-[6px]">★</span>
                                </div>
                                <span className="font-black text-[8px] text-red-700 dark:text-red-300 uppercase tracking-widest leading-none mt-0.5">
                                    {t('REJECTED')}
                                </span>
                                <span className="text-[6px] font-bold text-red-600/80 dark:text-red-400/80 tracking-tighter uppercase leading-none mt-0.5">
                                    {t('DECLINED')}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Cancelled Stamp inside Employee Card when Cancelled */}
                    {employeetransfer.status?.toLowerCase() === 'cancelled' && (
                        <div className="flex-shrink-0 relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-red-600 dark:border-red-400 p-0.5 bg-red-100/40 dark:bg-red-950/40 rotate-[-12deg] shadow-sm select-none">
                            <div className="w-full h-full rounded-full border border-dashed border-red-600 dark:border-red-400 flex flex-col items-center justify-center p-1 text-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px]">
                                <div className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                                    <span className="text-[6px]">★</span>
                                    <Ban className="w-3 h-3" />
                                    <span className="text-[6px]">★</span>
                                </div>
                                <span className="font-black text-[8px] text-red-700 dark:text-red-300 uppercase tracking-widest leading-none mt-0.5">
                                    {t('CANCELLED')}
                                </span>
                                <span className="text-[6px] font-bold text-red-600/80 dark:text-red-400/80 tracking-tighter uppercase leading-none mt-0.5">
                                    {t('REVOKED')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Transfer Path Details */}
                <div className="p-5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-4">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Building className="w-4 h-4 text-primary" />
                        <span>{t('Transfer Path')}</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                        {/* From Branch/Dept Card */}
                        <div className="p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 capitalize tracking-wider block">
                                {t('From (Current Location)')}
                            </span>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {employeetransfer.from_branch?.branch_name || employeetransfer.from_branch?.name || '-'}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {employeetransfer.from_department?.department_name || employeetransfer.from_department?.name || '-'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {employeetransfer.from_designation?.designation_name || employeetransfer.from_designation?.name || '-'}
                                </p>
                            </div>
                        </div>

                        {/* To Branch/Dept Card */}
                        <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 capitalize tracking-wider block">
                                {t('To (Target Location)')}
                            </span>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {employeetransfer.to_branch?.branch_name || employeetransfer.to_branch?.name || '-'}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {employeetransfer.to_department?.department_name || employeetransfer.to_department?.name || '-'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {employeetransfer.to_designation?.designation_name || employeetransfer.to_designation?.name || '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dates & Document Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Effective Date')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {employeetransfer.effective_date ? formatDate(employeetransfer.effective_date) : '-'}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Document')}
                        </label>
                        <div>
                            {employeetransfer.document ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = getImagePath(employeetransfer.document);
                                        link.download = employeetransfer.document?.split('/').pop() || 'transfer-document';
                                        link.click();
                                    }}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline pt-0.5"
                                >
                                    <Download className="h-4 w-4" />
                                    <span>{t('Download Document')}</span>
                                </button>
                            ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reason for Transfer */}
                {employeetransfer.reason && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Reason for Transfer')}
                        </label>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {employeetransfer.reason}
                        </p>
                    </div>
                )}

                {/* Approved By Box with Official Stamp (Shown only when approved) */}
                {employeetransfer.status?.toLowerCase() === 'approved' && (
                    <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between gap-4 relative overflow-hidden">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                                {employeetransfer.approved_by?.avatar ? (
                                    <img src={getImagePath(employeetransfer.approved_by.avatar)} alt={employeetransfer.approved_by.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                )}
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-xs font-medium text-emerald-800/70 dark:text-emerald-400/70 block capitalize tracking-wider">
                                    {t('Approved By')}
                                </span>
                                <p className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                                    {employeetransfer.approved_by?.name || t('Company Admin')}
                                </p>
                            </div>
                        </div>

                        {/* Official Approved Stamp Badge */}
                        <div className="flex-shrink-0 relative flex items-center justify-center w-16 h-16 rounded-full border-2 border-emerald-600 dark:border-emerald-400 p-0.5 bg-emerald-100/40 dark:bg-emerald-950/40 rotate-[-12deg] shadow-sm select-none">
                            <div className="w-full h-full rounded-full border border-dashed border-emerald-600 dark:border-emerald-400 flex flex-col items-center justify-center p-1 text-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px]">
                                <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                                    <span className="text-[7px]">★</span>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span className="text-[7px]">★</span>
                                </div>
                                <span className="font-black text-[9px] text-emerald-700 dark:text-emerald-300 uppercase tracking-widest leading-none mt-0.5">
                                    {t('APPROVED')}
                                </span>
                                <span className="text-[7px] font-bold text-emerald-600/80 dark:text-emerald-400/80 tracking-tighter uppercase leading-none mt-0.5">
                                    {t('VERIFIED')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}