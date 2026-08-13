import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceAging from './InvoiceAging';
import BillAging from './BillAging';
import TaxSummary from './TaxSummary';
import CustomerBalance from './CustomerBalance';
import VendorBalance from './VendorBalance';

interface ReportsIndexProps {
    auth: {
        user?: {
            permissions?: string[];
        }
    }
    financialYear?: {
        year_start_date: string;
        year_end_date: string;
    }
}

export default function Index() {
    const { t } = useTranslation();
    const { auth, financialYear } = usePage<ReportsIndexProps>().props;
    const [activeTab, setActiveTab] = useState('invoice-aging');


    const tabs = [
        { id: 'invoice-aging', label: t('Invoice Aging'), permission: 'view-invoice-aging' },
        { id: 'bill-aging', label: t('Bill Aging'), permission: 'view-bill-aging' },
        { id: 'tax-summary', label: t('Tax Summary'), permission: 'view-tax-summary' },
        { id: 'customer-balance', label: t('Customer Balance'), permission: 'view-customer-balance' },
        { id: 'vendor-balance', label: t('Vendor Balance'), permission: 'view-vendor-balance' },
    ].filter(tab => auth.user?.permissions?.includes(tab.permission));

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Accounting'), url: route('account.index')},
                { label: t('Reports') }
            ]}
            pageTitle={t('Reports')}
        >
            <Head title={t('Reports')} />

            <Card className="shadow-sm">
                <CardContent className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden h-auto p-1">
                            {tabs.map(tab => (
                                <TabsTrigger key={tab.id} value={tab.id} className="whitespace-nowrap flex-shrink-0">
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="invoice-aging" className="mt-4">
                            <InvoiceAging financialYear={financialYear} />
                        </TabsContent>

                        <TabsContent value="bill-aging" className="mt-4">
                            <BillAging financialYear={financialYear} />
                        </TabsContent>

                        <TabsContent value="tax-summary" className="mt-4">
                            <TaxSummary financialYear={financialYear} />
                        </TabsContent>

                        <TabsContent value="customer-balance" className="mt-4">
                            <CustomerBalance financialYear={financialYear} />
                        </TabsContent>

                        <TabsContent value="vendor-balance" className="mt-4">
                            <VendorBalance financialYear={financialYear} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
