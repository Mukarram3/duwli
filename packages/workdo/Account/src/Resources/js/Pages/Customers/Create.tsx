import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormSection, FormRow, COMPACT_FIELDS } from '@/components/duwli';
import { cn } from '@/lib/utils';
/*
 * Icons are ALIASED.
 *
 * `User` is also the name of a type imported from './types' further down.
 * Two bindings with the same name in one module is a duplicate identifier:
 * esbuild does not resolve named exports across modules so it compiles, and
 * Rollup then fails the production build with the misleading
 * "User is not exported by types.ts".
 *
 * Suffixing the icons removes the collision and makes it obvious at the call
 * site which one is a component.
 */
import {
    Users as UsersIcon,
    User as UserIcon,
    MapPin as MapPinIcon,
    Truck as TruckIcon,
    FileText as FileTextIcon,
    Save as SaveIcon,
} from 'lucide-react';
import { useForm, router } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import InputError from "@/components/ui/input-error";
import { PhoneInputComponent } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerFormData, User } from './types';
import { useFormFields } from '@/hooks/useFormFields';
interface CreateCustomerProps {
    onSuccess: () => void;
    users: User[];
    auth: {
        user: {
            permissions: string[];
        };
    };
}

export default function Create({ onSuccess, users = [], auth }: CreateCustomerProps) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors, transform } = useForm<CustomerFormData>({
        user_id: undefined,
        company_name: '',
        contact_person_name: '',
        contact_person_email: '',
        contact_person_mobile: '',
        tax_number: '',
        payment_terms: '',
        billing_address: {
            name: '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            country: '',
            zip_code: ''
        },
        shipping_address: {
            name: '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            country: '',
            zip_code: ''
        },
        same_as_billing: false,
        notes: '',
    });
    const setDataWrapper = (key: string, value: any) => {
        setData(key as keyof CustomerFormData, value);
    };

    const formFields = useFormFields('customerCreateFields', data, setDataWrapper, errors, 'create');
    const handleUserSelect = (userId: string) => {
        const actualUserId = userId === '0' ? undefined : parseInt(userId);
        setData('user_id', actualUserId);
        if (userId !== '0') {
            const selectedUser = users.find(user => user.id.toString() === userId);
            if (selectedUser) {
                setData({
                    ...data,
                    user_id: actualUserId,
                    contact_person_name: selectedUser.name,
                    contact_person_email: selectedUser.email,
                    contact_person_mobile: selectedUser.mobile_no || '',
                });
            }
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        /*
         * transform(), NOT a `data` key in the post options.
         *
         * useForm().post(url, options) takes VISIT options — there is no `data`
         * property, so passing one is silently ignored and the form submits its
         * own untouched state. transform() is the supported hook for rewriting
         * the payload at submit time.
         */
        transform((current: any) => ({
            ...current,
            user_id: (!current.user_id || String(current.user_id) === '0') ? null : current.user_id,
        }));

        post(route('account.customers.store'), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    /*
     * Portal access — the optional user link. Kept as its own variable so the
     * panel markup above stays readable, and collapsed because almost nobody
     * needs it: CustomerUserLinkService creates the user from the email after
     * save. See the earlier fix — this field is optional at every level.
     */
    const portalAccessSection = (
        <details className="rounded-lg border bg-muted/30 p-3">
            <summary className="cursor-pointer text-[13px] font-medium">
                {t('Portal access')}{' '}
                <span className="font-normal text-muted-foreground">{t('(optional)')}</span>
            </summary>

            <div className="mt-3">
                <p className="mb-2 text-xs text-muted-foreground">
                    {t('Link this customer to a user account so they can sign in to the portal. Leave this empty to create the customer as a record only.')}
                </p>

                <Label htmlFor="user_id">{t('User account')}</Label>
                <Select value={data.user_id?.toString() || '0'} onValueChange={handleUserSelect}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('No user account')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">{t('No user account')}</SelectItem>
                        {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name} ({user.email})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.user_id} />
            </div>
        </details>
    );

    /*
     * WIDE FOUR-PANEL LAYOUT, matching the reference.
     *
     * Was a single narrow column in a max-w-2xl dialog: eighteen fields
     * stacked one per row, so creating a customer meant scrolling through
     * three screens and the Save button was never in view.
     *
     * Now a two-column grid of titled panels with the label beside each
     * field, built from the shared FormSection/FormRow pair — the same
     * measurements the invoice forms use, so the system stays consistent
     * rather than this screen inventing its own "compact".
     */
    return (
        <DialogContent className={cn(
            'max-h-[92vh] max-w-6xl overflow-hidden p-0 gap-0',
            COMPACT_FIELDS,
        )}>
            {/* Sticky action bar: Save stays reachable without scrolling back. */}
            <div className="flex items-center justify-between bg-[#0b4a96] px-5 py-3 text-white">
                <div className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    <DialogTitle className="text-[15px] font-semibold text-white">
                        {t('Create Customer')}
                    </DialogTitle>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm"
                        className="h-8 border-white/30 bg-transparent text-white hover:bg-white/10"
                        onClick={onSuccess}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" form="customer-form" size="sm" disabled={processing}
                        className="h-8 gap-1.5 bg-[#2f7fd6] hover:bg-[#2f7fd6]/90">
                        <SaveIcon className="h-4 w-4" />
                        {processing ? t('Creating...') : t('Save')}
                    </Button>
                </div>
            </div>

            <form id="customer-form" onSubmit={submit} className="overflow-y-auto p-4">
                <div className="grid gap-4 lg:grid-cols-2">

                    {/* ── customer information ── */}
                    <div className="rounded-lg border">
                        <FormSection title={t('Customer Information')} icon={UserIcon}>
                            <FormRow label={t('Company Name')} required htmlFor="company_name" wide>
                                <Input id="company_name" value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    placeholder={t('Enter company name')} required />
                                <InputError message={errors.company_name} />
                            </FormRow>

                            <FormRow label={t('Contact Person')} required htmlFor="contact_person_name" wide>
                                <Input id="contact_person_name" value={data.contact_person_name}
                                    onChange={(e) => setData('contact_person_name', e.target.value)}
                                    placeholder={t('Enter contact person name')} required />
                                <InputError message={errors.contact_person_name} />
                            </FormRow>

                            <FormRow label={t('Email')} required htmlFor="contact_person_email" wide>
                                <Input id="contact_person_email" type="email" value={data.contact_person_email}
                                    onChange={(e) => setData('contact_person_email', e.target.value)}
                                    placeholder={t('Enter email address')} required />
                                <InputError message={errors.contact_person_email} />
                            </FormRow>

                            <FormRow
                                label={t('Mobile Number')}
                                htmlFor="contact_person_mobile"
                                wide
                                hint={t('Format: +[country code][phone number]')}
                            >
                                <Input id="contact_person_mobile" value={data.contact_person_mobile}
                                    onChange={(e) => setData('contact_person_mobile', e.target.value)}
                                    placeholder="+966500000000" className="ltr-text" />
                                <InputError message={errors.contact_person_mobile} />
                            </FormRow>

                            <FormRow label={t('Tax Number')} htmlFor="tax_number">
                                <Input id="tax_number" value={data.tax_number}
                                    onChange={(e) => setData('tax_number', e.target.value)}
                                    placeholder={t('Enter tax number')} className="ltr-text" />
                                <InputError message={errors.tax_number} />
                            </FormRow>

                            <FormRow label={t('Payment Terms')} htmlFor="payment_terms">
                                <Input id="payment_terms" value={data.payment_terms}
                                    onChange={(e) => setData('payment_terms', e.target.value)}
                                    placeholder={t('e.g., Net 30')} />
                                <InputError message={errors.payment_terms} />
                            </FormRow>
                        </FormSection>
                    </div>

                    {/* ── billing address ── */}
                    <div className="rounded-lg border">
                        <FormSection title={t('Billing Address')} icon={MapPinIcon}>
                            {[
                                ['name', t('Billing Name'), t('Enter billing name'), true, true],
                                ['address_line_1', t('Billing Address'), t('Enter billing address'), true, true],
                                ['address_line_2', t('Address Line 2'), t('Address line 2 (optional)'), false, true],
                                ['city', t('City'), t('Enter city'), true, false],
                                ['state', t('State'), t('Enter state / district'), true, false],
                                ['country', t('Country'), t('Enter country'), true, false],
                                ['zip_code', t('Zip Code'), t('Enter zip code'), true, false],
                            ].map(([key, label, ph, req, wide]: any) => (
                                <FormRow key={key} label={label} required={req} wide={wide} htmlFor={`billing_${key}`}>
                                    <Input
                                        id={`billing_${key}`}
                                        value={data.billing_address[key]}
                                        onChange={(e) => setData('billing_address', { ...data.billing_address, [key]: e.target.value })}
                                        placeholder={ph}
                                        required={req}
                                    />
                                    <InputError message={errors[`billing_address.${key}`]} />
                                </FormRow>
                            ))}
                        </FormSection>
                    </div>

                    {/* ── shipping address ── */}
                    <div className="rounded-lg border">
                        <FormSection title={t('Shipping Address')} icon={TruckIcon}>
                            <div className="lg:col-span-2 flex items-center gap-2">
                                <Checkbox
                                    id="same_as_billing"
                                    checked={data.same_as_billing}
                                    onCheckedChange={(v) => setData('same_as_billing', Boolean(v))}
                                />
                                <label htmlFor="same_as_billing" className="text-[13px] font-medium">
                                    {t('Shipping address same as billing')}
                                </label>
                            </div>

                            {/* Hidden rather than disabled when it mirrors billing:
                                a column of greyed-out duplicates is just noise. */}
                            {!data.same_as_billing && [
                                ['name', t('Shipping Name'), t('Enter shipping name'), true, true],
                                ['address_line_1', t('Shipping Address'), t('Enter shipping address'), true, true],
                                ['address_line_2', t('Address Line 2'), t('Address line 2 (optional)'), false, true],
                                ['city', t('City'), t('Enter city'), true, false],
                                ['state', t('State'), t('Enter state / district'), true, false],
                                ['country', t('Country'), t('Enter country'), true, false],
                                ['zip_code', t('Zip Code'), t('Enter zip code'), true, false],
                            ].map(([key, label, ph, req, wide]: any) => (
                                <FormRow key={key} label={label} required={req} wide={wide} htmlFor={`shipping_${key}`}>
                                    <Input
                                        id={`shipping_${key}`}
                                        value={data.shipping_address[key]}
                                        onChange={(e) => setData('shipping_address', { ...data.shipping_address, [key]: e.target.value })}
                                        placeholder={ph}
                                        required={req}
                                    />
                                    <InputError message={errors[`shipping_address.${key}`]} />
                                </FormRow>
                            ))}
                        </FormSection>
                    </div>

                    {/* ── notes + portal access ── */}
                    <div className="rounded-lg border">
                        <FormSection title={t('Notes')} icon={FileTextIcon}>
                            <FormRow label={t('Notes')} htmlFor="notes" wide>
                                <Textarea id="notes" rows={3} value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder={t('Enter notes (optional)')} />
                                <InputError message={errors.notes} />
                            </FormRow>

                            <div className="lg:col-span-2">
                                {portalAccessSection}
                            </div>
                        </FormSection>
                    </div>
                </div>
            </form>
        </DialogContent>
    );
}