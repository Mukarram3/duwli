import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatCurrency, getImagePath } from '@/utils/helpers';
import { Users, TrendingUp, DollarSign, ShoppingCart, Hash, CalendarDays, User as UserIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { DataTable } from "@/components/ui/data-table";
import NoRecordsFound from '@/components/no-records-found';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

interface CustomersReportProps {
    customerData: Array<{
        customer_id: number | null;
        total_orders: number;
        total_spent: number;
        avg_order_value: number;
        last_order_date: string;
        customer?: { name: string; avatar?: string | null; email?: string | null };
    }>;
}

export default function CustomersReport({ customerData }: CustomersReportProps) {
    const { t } = useTranslation();

    return (
        <AuthenticatedLayout
            breadcrumbs={[
            { label: t('POS'), url: route('pos.index') },
            { label: t('Customer Report') }
            ]}
            pageTitle={t('Customer Report')}
        >
            <Head title={t('Customer Report')} />

            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <div className="absolute top-2 right-2">
                            <Users className="h-5 w-5 text-blue-700 opacity-80" />
                        </div>
                        <CardHeader className="text-center space-y-0 pb-1 pt-3">
                            <div className="text-2xl font-bold text-blue-700">{customerData?.length || 0}</div>
                        </CardHeader>
                        <CardContent className="text-center pt-1 pb-3">
                            <CardTitle className="text-sm font-medium text-blue-700">{t('Total Customers')}</CardTitle>
                        </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                        <div className="absolute top-2 right-2">
                            <DollarSign className="h-5 w-5 text-green-700 opacity-80" />
                        </div>
                        <CardHeader className="text-center space-y-0 pb-1 pt-3">
                            <div className="text-2xl font-bold text-green-700">
                                {formatCurrency(customerData?.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0) || 0)}
                            </div>
                        </CardHeader>
                        <CardContent className="text-center pt-1 pb-3">
                            <CardTitle className="text-sm font-medium text-green-700">{t('Total Revenue')}</CardTitle>
                        </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                        <div className="absolute top-2 right-2">
                            <ShoppingCart className="h-5 w-5 text-purple-700 opacity-80" />
                        </div>
                        <CardHeader className="text-center space-y-0 pb-1 pt-3">
                            <div className="text-2xl font-bold text-purple-700">
                                {customerData?.reduce((sum, c) => sum + (Number(c.total_orders) || 0), 0) || 0}
                            </div>
                        </CardHeader>
                        <CardContent className="text-center pt-1 pb-3">
                            <CardTitle className="text-sm font-medium text-purple-700">{t('Total Orders')}</CardTitle>
                        </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                        <div className="absolute top-2 right-2">
                            <TrendingUp className="h-5 w-5 text-orange-700 opacity-80" />
                        </div>
                        <CardHeader className="text-center space-y-0 pb-1 pt-3">
                            <div className="text-2xl font-bold text-orange-700">
                                {formatCurrency(
                                    customerData?.length > 0 
                                        ? customerData.reduce((sum, c) => sum + (Number(c.avg_order_value) || 0), 0) / customerData.length 
                                        : 0
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="text-center pt-1 pb-3">
                            <CardTitle className="text-sm font-medium text-orange-700">{t('Avg Order Value')}</CardTitle>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Customers Bar Chart */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <DollarSign className="h-4 w-4" />
                                {t('Top 10 Customers by Spending')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-0 flex justify-center">
                            {customerData?.length > 0 ? (
                                <div className="w-full">
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={customerData?.slice(0, 10).map(customer => ({ 
                                            name: (customer.name || customer.customer?.name || 'Walk-in').substring(0, 10), 
                                            value: Number(customer.total_spent) || 0
                                        })) || []} margin={{ bottom: 60 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="name" 
                                                angle={-45} 
                                                textAnchor="end" 
                                                height={60}
                                                interval={0}
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#3b82f6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-muted-foreground">
                                    <div className="text-center">
                                        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">{t('No spending data available')}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Customer Order Distribution Pie Chart */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="h-4 w-4" />
                                {t('Order Distribution')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                            {customerData?.length > 0 ? (
                                <div className="w-full">
                                    <ResponsiveContainer width="100%" height={320}>
                                        <RechartsPieChart>
                                            <Tooltip 
                                                formatter={(value) => [value, t('Orders')]}
                                            />
                                            <Pie
                                                data={customerData?.slice(0, 10) || []}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ customer }) => customer?.name || 'Walk-in'}
                                                outerRadius={120}
                                                fill="#8884d8"
                                                dataKey="total_orders"
                                            >
                                                {(customerData?.slice(0, 10) || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-muted-foreground">
                                    <div className="text-center">
                                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">{t('No order data available')}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Data Table */}
                <Card className="shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Customer Performance Report')}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                            {customerData?.length || 0} {t('customers')}
                        </span>
                    </div>
                    <CardContent className="p-0">
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent h-96 rounded-none w-full">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={customerData || []}
                                    columns={[
                                        {
                                            key: 'customer',
                                            header: t('Customer'),
                                            render: (_value: any, item: CustomersReportProps['customerData'][0]) => {
                                                const name = item.customer?.name || t('Walk-in');
                                                const isWalkin = !item.customer_id;
                                                const avatar = item.customer?.avatar;
                                                const initials = name
                                                    .split(' ')
                                                    .map((w: string) => w[0])
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase();
                                                return (
                                                    <div className="flex items-center gap-3 py-0.5">
                                                        {/* Avatar — same pattern as users index */}
                                                        <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                                                            {avatar ? (
                                                                <img
                                                                    src={getImagePath(avatar)}
                                                                    alt={name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        const fallback = target.nextElementSibling as HTMLElement;
                                                                        if (fallback) fallback.classList.remove('hidden');
                                                                    }}
                                                                />
                                                            ) : null}
                                                            {avatar ? (
                                                                <UserIcon className="hidden w-5 h-5 text-gray-400" />
                                                            ) : isWalkin ? (
                                                                <Users className="w-4 h-4 text-gray-400" />
                                                            ) : (
                                                                <span className="text-xs font-bold text-gray-500">{initials}</span>
                                                            )}
                                                        </div>
                                                        {/* Name + email */}
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate leading-tight">{name}</p>
                                                            {isWalkin ? (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 mt-0.5">
                                                                    {t('Walk-in Customer')}
                                                                </span>
                                                            ) : (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{item.customer?.email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        },
                                        {
                                            key: 'total_orders',
                                            header: t('Total Orders'),
                                            render: (value: number) => (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800">
                                                    <ShoppingCart className="h-3 w-3" />
                                                    {value}
                                                </span>
                                            )
                                        },
                                        {
                                            key: 'total_spent',
                                            header: t('Total Spent'),
                                            render: (value: number) => {
                                                const total = customerData?.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0) || 0;
                                                return (
                                                    <div className="space-y-1.5">
                                                        <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                                                            {formatCurrency(value)}
                                                        </span>
                                                        <div className="w-24 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-emerald-500"
                                                                style={{ width: `${total > 0 ? Math.min((value / total) * 100, 100) : 0}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        },
                                        {
                                            key: 'avg_order_value',
                                            header: t('Avg Order Value'),
                                            render: (value: number) => (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800">
                                                    <Hash className="h-3 w-3" />
                                                    {formatCurrency(value)}
                                                </span>
                                            )
                                        },
                                        {
                                            key: 'last_order_date',
                                            header: t('Last Order'),
                                            render: (value: string) => (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                    <CalendarDays className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                                                    <span>{formatDate(value)}</span>
                                                </div>
                                            )
                                        }
                                    ]}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={Users}
                                            title={t('No customers found')}
                                            description={t('No customer data available for the selected period.')}
                                            hasFilters={false}
                                            onClearFilters={() => {}}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}