// packages/workdo/Account/src/Resources/js/Pages/components/PaymentEditDialog.tsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Loader2, Save } from 'lucide-react';

/**
 * PAYMENT EDIT DIALOG
 * -----------------------------------------------------------------------------
 * Shared by Customer Receipts and Vendor Payments — the two forms are identical
 * apart from wording and the route they post to, so they are one component.
 *
 * WHAT IT DOES NOT LET YOU CHANGE, AND WHY
 * The customer/vendor cannot be changed here. Moving a posted payment to a
 * different party is not an edit — it unwinds one party's balance and creates
 * another's, which is what a cancel-and-re-enter is for. Allowing it in a quick
 * edit dialog would be the easiest way to silently corrupt two accounts at once.
 *
 * The allocations are not edited here either. They are SCALED proportionally by
 * the controller when the amount changes, which is right for the common case
 * (one payment, one invoice). Re-splitting a payment across different invoices
 * belongs in a dedicated allocation screen.
 *
 * The warning below is not decoration: the controller unposts, applies and
 * re-posts inside a transaction, so saving here genuinely moves numbers on the
 * ledger, the bank account and the invoice.
 */

type Payment = {
    id: number;
    payment_number?: string;
    payment_amount: number | string;
    payment_date: string;
    bank_account_id: number | string;
    reference_number?: string | null;
    notes?: string | null;
    status?: string;
};

type Props = {
    payment: Payment | null;
    bankAccounts: any[];
    /** 'customer' or 'vendor' — decides the route and the wording. */
    kind: 'customer' | 'vendor';
    onClose: () => void;
};

export default function PaymentEditDialog({ payment, bankAccounts, kind, onClose }: Props) {
    const { t } = useTranslation();
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        payment_amount: payment ? String(payment.payment_amount) : '',
        payment_date: payment?.payment_date?.slice(0, 10) || '',
        bank_account_id: payment ? String(payment.bank_account_id ?? '') : '',
        reference_number: payment?.reference_number || '',
        notes: payment?.notes || '',
    });

    if (!payment) return null;

    const routeName = kind === 'customer'
        ? 'account.customer-payments.update'
        : 'account.vendor-payments.update';

    const label = kind === 'customer' ? t('Receipt') : t('Payment');

    const save = () => {
        setSaving(true);
        router.patch(route(routeName, payment.id), form, {
            preserveScroll: true,
            onFinish: () => {
                setSaving(false);
                onClose();
            },
        });
    };

    const amountChanged = String(payment.payment_amount) !== form.payment_amount;

    return (
        <Dialog open={!!payment} onOpenChange={(open) => (!open ? onClose() : undefined)}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {t('Edit')} {label} {payment.payment_number ? `— ${payment.payment_number}` : ''}
                    </DialogTitle>
                    <DialogDescription>
                        {kind === 'customer'
                            ? t('Changing the amount adjusts the invoice balance and the accounting entries.')
                            : t('Changing the amount adjusts the bill balance and the accounting entries.')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="payment_amount">{t('Amount')}</Label>
                        <Input
                            id="payment_amount"
                            type="number"
                            step="any"
                            min="0.01"
                            value={form.payment_amount}
                            onChange={(e) => setForm({ ...form, payment_amount: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="payment_date">{t('Date')}</Label>
                        <Input
                            id="payment_date"
                            type="date"
                            value={form.payment_date}
                            onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label>{t('Payment Account')}</Label>
                        <Select
                            value={form.bank_account_id}
                            onValueChange={(v) => setForm({ ...form, bank_account_id: v })}
                        >
                            <SelectTrigger><SelectValue placeholder={t('Select account')} /></SelectTrigger>
                            <SelectContent>
                                {bankAccounts.map((account: any) => (
                                    <SelectItem key={account.id} value={String(account.id)}>
                                        {account.account_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="reference_number">{t('Reference')}</Label>
                        <Input
                            id="reference_number"
                            value={form.reference_number}
                            onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">{t('Description')}</Label>
                        <Textarea
                            id="notes"
                            rows={2}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                    </div>

                    {/*
                      Shown only when the amount actually changed. A standing
                      warning on every edit gets ignored; one that appears
                      because of what the user just typed gets read.
                    */}
                    {amountChanged && (
                        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/30">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <span className="text-amber-800 dark:text-amber-400">
                                {t('The accounting entries will be reversed and re-posted at the new amount, and the allocations scaled to match.')}
                            </span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={save} disabled={saving} className="gap-1.5">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {t('Save Changes')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
