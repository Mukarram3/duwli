// packages/workdo/Account/src/Resources/js/Pages/JournalEntries/Create.tsx
import { useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Check, AlertTriangle, Save } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { cn } from '@/lib/utils';

type Account = {
    id: number;
    account_code: string;
    account_name: string;
    normal_balance: 'debit' | 'credit';
};

type Line = {
    account_id: string;
    description: string;
    debit_amount: string;
    credit_amount: string;
};

type Props = {
    accounts: Account[];
    journalNumber: string;
    journalEntry?: {
        id: number;
        journal_number: string;
        journal_date: string;
        description: string;
        items: Array<{
            account_id: number;
            description: string | null;
            debit_amount: string;
            credit_amount: string;
        }>;
    };
};

const blankLine = (): Line => ({
    account_id: '',
    description: '',
    debit_amount: '',
    credit_amount: '',
});

export default function Create({ accounts, journalNumber, journalEntry }: Props) {
    const { t } = useTranslation();
    const isEdit = !!journalEntry;

    const [lines, setLines] = useState<Line[]>(() => {
        if (journalEntry?.items?.length) {
            return journalEntry.items.map((item) => ({
                account_id: String(item.account_id),
                description: item.description || '',
                debit_amount: Number(item.debit_amount) > 0 ? String(Number(item.debit_amount)) : '',
                credit_amount: Number(item.credit_amount) > 0 ? String(Number(item.credit_amount)) : '',
            }));
        }
        return [blankLine(), blankLine()];
    });

    const { data, setData, processing, errors } = useForm({
        journal_date: journalEntry?.journal_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        description: journalEntry?.description || '',
        post_immediately: false as boolean,
    });

    // Live totals — the whole point of this screen is that the accountant can
    // see at every keystroke whether the entry balances.
    const totals = useMemo(() => {
        const debit = lines.reduce((sum, l) => sum + (parseFloat(l.debit_amount) || 0), 0);
        const credit = lines.reduce((sum, l) => sum + (parseFloat(l.credit_amount) || 0), 0);
        const difference = Math.round((debit - credit) * 100) / 100;
        const filled = lines.filter(
            (l) => l.account_id && ((parseFloat(l.debit_amount) || 0) > 0 || (parseFloat(l.credit_amount) || 0) > 0),
        ).length;
        return {
            debit,
            credit,
            difference,
            balanced: Math.abs(difference) < 0.01 && debit > 0,
            usableLines: filled,
        };
    }, [lines]);

    const canSubmit = totals.balanced && totals.usableLines >= 2 && data.description.trim().length > 0;

    const updateLine = (index: number, field: keyof Line, value: string) => {
        setLines((current) =>
            current.map((line, i) => {
                if (i !== index) return line;
                const next = { ...line, [field]: value };
                // A line is either a debit or a credit, never both.
                if (field === 'debit_amount' && value) next.credit_amount = '';
                if (field === 'credit_amount' && value) next.debit_amount = '';
                return next;
            }),
        );
    };

    const addLine = () => setLines((current) => [...current, blankLine()]);

    const removeLine = (index: number) =>
        setLines((current) => (current.length <= 2 ? current : current.filter((_, i) => i !== index)));

    /** Fill the remaining imbalance into an empty side — a standard ledger convenience. */
    const balanceRemainder = (index: number) => {
        const diff = totals.difference;
        if (Math.abs(diff) < 0.01) return;
        updateLine(index, diff > 0 ? 'credit_amount' : 'debit_amount', Math.abs(diff).toFixed(2));
    };

    const submit = (postImmediately: boolean) => {
        const payload = {
            journal_date: data.journal_date,
            description: data.description,
            post_immediately: postImmediately,
            lines: lines
                .filter((l) => l.account_id)
                .map((l) => ({
                    account_id: l.account_id,
                    description: l.description,
                    debit_amount: parseFloat(l.debit_amount) || 0,
                    credit_amount: parseFloat(l.credit_amount) || 0,
                })),
        };

        if (isEdit) {
            router.put(route('account.journal-entries.update', journalEntry!.id), payload);
        } else {
            router.post(route('account.journal-entries.store'), payload);
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Journal Entries'), url: route('account.journal-entries.index') },
                { label: isEdit ? t('Edit') : t('New Journal Entry') },
            ]}
            pageTitle={isEdit ? t('Edit Journal Entry') : t('New Journal Entry')}
            pageDescription={t('Record a manual double-entry adjustment. Total debits must equal total credits.')}
            backUrl={route('account.journal-entries.index')}
        >
            <Head title={t('New Journal Entry')} />

            <Card className="shadow-sm">
                <CardHeader className="border-b bg-muted/30 py-4">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <CardTitle className="text-base">
                            {t('Entry')} <span className="font-mono text-muted-foreground">{journalNumber}</span>
                        </CardTitle>

                        {/* Balance indicator — always visible, never hidden behind a save attempt. */}
                        <div
                            className={cn(
                                'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold',
                                totals.balanced
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-amber-200 bg-amber-50 text-amber-700',
                            )}
                        >
                            {totals.balanced ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            {totals.balanced
                                ? t('Balanced')
                                : `${t('Out of balance by')} ${formatCurrency(Math.abs(totals.difference))}`}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 p-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <Label htmlFor="journal_date">{t('Date')}</Label>
                            <Input
                                id="journal_date"
                                type="date"
                                value={data.journal_date}
                                onChange={(e) => setData('journal_date', e.target.value)}
                                className="mt-1"
                            />
                            {errors.journal_date && (
                                <p className="mt-1 text-sm text-destructive">{errors.journal_date}</p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <Label htmlFor="description">{t('Description')}</Label>
                            <Textarea
                                id="description"
                                rows={1}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder={t('What is this entry for?')}
                                className="mt-1 min-h-[38px]"
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-destructive">{errors.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Lines */}
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="text-left">
                                    <th className="px-3 py-2 font-medium">{t('Account')}</th>
                                    <th className="px-3 py-2 font-medium">{t('Line Description')}</th>
                                    <th className="w-40 px-3 py-2 text-right font-medium">{t('Debit')}</th>
                                    <th className="w-40 px-3 py-2 text-right font-medium">{t('Credit')}</th>
                                    <th className="w-12 px-3 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((line, index) => (
                                    <tr key={index} className="border-t">
                                        <td className="px-3 py-2">
                                            <Select
                                                value={line.account_id}
                                                onValueChange={(value) => updateLine(index, 'account_id', value)}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder={t('Select account')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts.map((account) => (
                                                        <SelectItem key={account.id} value={String(account.id)}>
                                                            <span className="font-mono text-xs text-muted-foreground">
                                                                {account.account_code}
                                                            </span>{' '}
                                                            {account.account_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-3 py-2">
                                            <Input
                                                className="h-9"
                                                value={line.description}
                                                onChange={(e) => updateLine(index, 'description', e.target.value)}
                                                placeholder={t('Uses entry description')}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Input
                                                className="h-9 text-right"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={line.debit_amount}
                                                onChange={(e) => updateLine(index, 'debit_amount', e.target.value)}
                                                onDoubleClick={() => balanceRemainder(index)}
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Input
                                                className="h-9 text-right"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={line.credit_amount}
                                                onChange={(e) => updateLine(index, 'credit_amount', e.target.value)}
                                                onDoubleClick={() => balanceRemainder(index)}
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={lines.length <= 2}
                                                onClick={() => removeLine(index)}
                                                className="h-8 w-8 p-0 text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t bg-muted/30 font-semibold">
                                <tr>
                                    <td className="px-3 py-2" colSpan={2}>
                                        {t('Totals')}
                                    </td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.debit)}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.credit)}</td>
                                    <td />
                                </tr>
                                {!totals.balanced && (
                                    <tr className="text-amber-700">
                                        <td className="px-3 pb-2" colSpan={2}>
                                            {t('Difference')}
                                        </td>
                                        <td className="px-3 pb-2 text-right" colSpan={2}>
                                            {formatCurrency(Math.abs(totals.difference))}{' '}
                                            <span className="font-normal">
                                                ({totals.difference > 0 ? t('needs credit') : t('needs debit')})
                                            </span>
                                        </td>
                                        <td />
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button type="button" variant="outline" onClick={addLine}>
                            <Plus className="mr-1.5 h-4 w-4" />
                            {t('Add Line')}
                        </Button>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing || !canSubmit}
                                onClick={() => submit(false)}
                            >
                                <Save className="mr-1.5 h-4 w-4" />
                                {t('Save as Draft')}
                            </Button>
                            <Button type="button" disabled={processing || !canSubmit} onClick={() => submit(true)}>
                                <Check className="mr-1.5 h-4 w-4" />
                                {t('Save and Post')}
                            </Button>
                        </div>
                    </div>

                    {!canSubmit && (
                        <p className="text-sm text-muted-foreground">
                            {totals.usableLines < 2
                                ? t('Add at least two lines with an account and an amount.')
                                : !data.description.trim()
                                  ? t('Add a description for this entry.')
                                  : t('Debits and credits must match before this entry can be saved.')}
                        </p>
                    )}
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
