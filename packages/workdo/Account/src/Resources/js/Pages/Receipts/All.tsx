// packages/workdo/Account/src/Resources/js/Pages/Receipts/All.tsx
import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageActionBar, actionRoute, type PageAction } from '@/components/page-action-bar';
import { ArrowDownLeft, ArrowUpRight, Download, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { cn } from '@/lib/utils';

/**
 * ALL RECEIPTS
 * ----------------------------------------------------------------------------
 * Customer and vendor payments in one list — money in and money out together.
 *
 * Direction is shown explicitly on every row rather than implied by which page
 * you came from. In a combined list, "received" and "paid" looking alike is how
 * a reconciliation goes wrong.
 */

type Receipt = {
    id: number;
    payment_number: string;
    payment_date: string;
    direction: 'received' | 'paid';
    party: string;
    bank_account: string;
    amount: number | string;
    status: string;
};

const statusTone: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    pending: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    cancelled: 'bg-red-100 text-red-800 hover:bg-red-100',
};

export default function AllReceipts() {
    const { t } = useTranslation();
    const { receipts = [], totals, filters: initial, auth } = usePage<any>().props;
    const [search, setSearch] = useState(initial?.search || '');

    const applySearch = () =>
        router.get(route('account.vendor-payments.all-receipts'), { search }, {
            preserveState: true,
            replace: true,
        });

    const actions: PageAction[] = [
        {
            label: t('Vendor Receipts'),
            href: actionRoute('account.vendor-payments.index'),
            variant: 'primary',
            permission: 'manage-vendor-payments',
        },
        {
            label: t('Customer Receipts'),
            href: actionRoute('account.customer-payments.index'),
            variant: 'primary',
            permission: 'manage-customer-payments',
        },
        {
            label: t('Export'),
            href: actionRoute('account.vendor-payments.export-all'),
            icon: Download,
            variant: 'primary',
            external: true,
            permission: 'manage-vendor-payments',
        },
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Receipts') }, { label: t('All Receipts') }]}
            pageTitle={t('All Receipts')}
            pageDescription={t('Customer and vendor receipts together.')}
            pageActions={<PageActionBar actions={actions} permissions={auth.user?.permissions} />}
        >
            <Head title={t('All Receipts')} />

            {/* Totals — the point of a combined view is the net position. */}
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="p-5">
                    <p className="mb-1 text-sm text-muted-foreground">{t('Received')}</p>
                    <p className="text-2xl font-semibold text-emerald-600">
                        {formatCurrency(totals?.received ?? 0)}
                    </p>
                </Card>
                <Card className="p-5">
                    <p className="mb-1 text-sm text-muted-foreground">{t('Paid')}</p>
                    <p className="text-2xl font-semibold text-red-600">
                        {formatCurrency(totals?.paid ?? 0)}
                    </p>
                </Card>
                <Card className="p-5">
                    <p className="mb-1 text-sm text-muted-foreground">{t('Net')}</p>
                    <p
                        className={cn(
                            'text-2xl font-semibold',
                            (totals?.net ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600',
                        )}
                    >
                        {formatCurrency(totals?.net ?? 0)}
                    </p>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardContent className="border-b bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                            placeholder={t('Search by receipt number...')}
                            className="h-9 max-w-sm"
                        />
                        <Button size="sm" onClick={applySearch} className="h-9">
                            <Search className="mr-1.5 h-4 w-4" />
                            {t('Search')}
                        </Button>
                    </div>
                </CardContent>

                <CardContent className="p-0">
                    {receipts.length === 0 ? (
                        <div className="py-16 text-center text-sm text-muted-foreground">
                            {t('No receipts found.')}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">{t('Receipt Number')}</th>
                                        <th className="px-4 py-3 font-medium">{t('Date')}</th>
                                        <th className="px-4 py-3 font-medium">{t('Direction')}</th>
                                        <th className="px-4 py-3 font-medium">{t('Customer / Vendor')}</th>
                                        <th className="px-4 py-3 font-medium">{t('Bank Account')}</th>
                                        <th className="px-4 py-3 text-right font-medium">{t('Amount')}</th>
                                        <th className="px-4 py-3 font-medium">{t('Status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receipts.map((receipt: Receipt) => {
                                        const isIn = receipt.direction === 'received';
                                        return (
                                            <tr
                                                key={`${receipt.direction}-${receipt.id}`}
                                                className="border-t hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    {receipt.payment_number}
                                                </td>
                                                <td className="px-4 py-3">{formatDate(receipt.payment_date)}</td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                                            isIn
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-red-100 text-red-800',
                                                        )}
                                                    >
                                                        {isIn ? (
                                                            <ArrowDownLeft className="h-3 w-3" />
                                                        ) : (
                                                            <ArrowUpRight className="h-3 w-3" />
                                                        )}
                                                        {isIn ? t('Received') : t('Paid')}
                                                    </span>
                                                </td>
                                                <td className="max-w-[220px] truncate px-4 py-3">
                                                    {receipt.party || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {receipt.bank_account || '—'}
                                                </td>
                                                <td
                                                    className={cn(
                                                        'px-4 py-3 text-right font-medium',
                                                        isIn ? 'text-emerald-700' : 'text-red-700',
                                                    )}
                                                >
                                                    {isIn ? '+' : '−'} {formatCurrency(receipt.amount)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant="secondary"
                                                        className={statusTone[String(receipt.status).toLowerCase()] || ''}
                                                    >
                                                        {t(receipt.status)}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
