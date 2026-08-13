import { Head, usePage } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, FileText, User, MapPin, CreditCard, Clock, ShieldAlert } from 'lucide-react';
import { formatDate, getImagePath, getCurrencySymbol } from '@/utils/helpers';

export default function Show() {
    const { employee, documents } = usePage<any>().props;
    const { t } = useTranslation();

    const getGenderText = (gender: string) => {
        // Handle both old numeric values and new string values
        const genders: any = { "0": "Male", "1": "Female", "2": "Other" };
        return genders[gender] || gender || "Male";
    };

    const getEmploymentTypeText = (type: string) => {
        const types: any = { "0": "Full Time", "1": "Part Time", "2": "Temporary", "3": "Contract" };
        return types[type] || type;
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Employees'), url: route('hrm.employees.index') },
                { label: t('View Employee') }
            ]}
            pageTitle={t('Employee Details')}
            pageDescription={t('Detailed view of personal, banking, employment information, and documents for the employee.')}
            backUrl={route('hrm.employees.index')}
        >
            <Head title={t('Employee Details')} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Sidebar - Profile & Employment Summary */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                    {/* Profile Card */}
                    <Card className="shadow-sm border-gray-300 dark:border-zinc-700">
                        <CardContent className="p-6 text-center">
                            <div className="mb-4">
                                <img 
                                    src={employee.user?.avatar ? getImagePath(employee.user.avatar) : '/default-avatar.png'} 
                                    alt={employee.user?.name || 'Employee'}
                                    className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-gray-100 dark:border-gray-800"
                                    onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                                />
                            </div>
                            <h3 className="text-lg font-semibold">{employee.user?.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{employee.user?.email}</p>
                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                                employee.user?.is_disable === 1
                                    ? 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-950/20 dark:text-red-400 dark:ring-red-500/20'
                                    : 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-500/20'
                            }`}>
                                {employee.user?.is_disable === 1 ? t('Inactive') : t('Active')}
                            </span>
                        </CardContent>
                    </Card>

                    {/* Employment Summary Card */}
                    <Card className="shadow-sm border-gray-300 dark:border-zinc-700">
                        <CardHeader className="pb-3 border-b border-gray-200 dark:border-zinc-800">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {t('Employment Info')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('Employee ID')}</p>
                                <p className="font-medium text-sm mt-0.5">{employee.employee_id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('Branch')}</p>
                                <p className="font-medium text-sm mt-0.5">{employee.branch?.branch_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('Department')}</p>
                                <p className="font-medium text-sm mt-0.5">{employee.department?.department_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('Designation')}</p>
                                <p className="font-medium text-sm mt-0.5">{employee.designation?.designation_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('Employment Type')}</p>
                                <div className="mt-1">
                                    {(() => {
                                        const text = getEmploymentTypeText(employee.employment_type) || '-';
                                        const badgeStyles: any = {
                                            "Full Time": "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-500/20",
                                            "Part Time": "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-500/20",
                                            "Temporary": "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-500/20",
                                            "Contract": "bg-purple-50 text-purple-700 ring-purple-600/10 dark:bg-purple-950/20 dark:text-purple-400 dark:ring-purple-500/20",
                                        };
                                        const style = badgeStyles[text] || "bg-slate-50 text-slate-700 ring-slate-600/10 dark:bg-slate-900/20 dark:text-slate-400 dark:ring-slate-500/20";
                                        return (
                                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
                                                {t(text)}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('Date of Joining')}</p>
                                <p className="font-medium text-sm mt-0.5">{formatDate(employee.date_of_joining)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('Shift')}</p>
                                <p className="font-medium text-sm mt-0.5">{employee.shift?.shift_name || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Content - Personal, Contact, Banking, Hours & Documents */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Personal & Contact Details */}
                    <Card className="shadow-sm border-gray-300 dark:border-zinc-700">
                        <CardHeader className="pb-3 border-b border-gray-200 dark:border-zinc-800">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                {t('Personal & Contact Details')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Date of Birth')}</p>
                                    <p className="font-medium text-sm mt-0.5">{formatDate(employee.date_of_birth)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Gender')}</p>
                                    <p className="font-medium text-sm mt-0.5">{t(getGenderText(employee.gender))}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-sm text-muted-foreground">{t('Address Line 1')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.address_line_1 || '-'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-sm text-muted-foreground">{t('Address Line 2')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.address_line_2 || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('City')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.city || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('State')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.state || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Country')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.country || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Postal Code')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.postal_code || '-'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Emergency Contact */}
                    <Card className="shadow-sm border-gray-300 dark:border-zinc-700">
                        <CardHeader className="pb-3 border-b border-gray-200 dark:border-zinc-800">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                                {t('Emergency Contact')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Contact Name')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.emergency_contact_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Relationship')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.emergency_contact_relationship || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Contact Number')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.emergency_contact_number || '-'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Banking Info */}
                    <Card className="shadow-sm border-gray-300 dark:border-zinc-700">
                        <CardHeader className="pb-3 border-b border-gray-200 dark:border-zinc-800">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                {t('Banking Info')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Bank Name')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.bank_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Account Holder Name')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.account_holder_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Account Number')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.account_number || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Bank Identifier Code')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.bank_identifier_code || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Bank Branch')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.bank_branch || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Tax Payer ID')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.tax_payer_id || '-'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hours & Rates */}
                    <Card className="shadow-sm border-gray-300 dark:border-zinc-700">
                        <CardHeader className="pb-3 border-b border-gray-200 dark:border-zinc-800">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {t('Hours & Rates')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Basic Salary')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.basic_salary ? `${getCurrencySymbol()}${employee.basic_salary}` : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Hours Per Day')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.hours_per_day || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Days Per Week')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.days_per_week || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Rate Per Hour')}</p>
                                    <p className="font-medium text-sm mt-0.5">{employee.rate_per_hour ? `${getCurrencySymbol()}${employee.rate_per_hour}` : 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card className="shadow-sm border-gray-300 dark:border-zinc-700">
                        <CardHeader className="pb-3 border-b border-gray-200 dark:border-zinc-800">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                {t('Documents')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {documents && documents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {documents.map((doc: any, index: number) => (
                                        <Card key={doc.id || index} className="p-4 shadow-sm border-gray-300 dark:border-zinc-700">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <p className="font-medium text-sm truncate">{doc.document_name || doc.title || 'Document'}</p>
                                                    <p className="text-xs text-muted-foreground truncate mt-1">
                                                        {doc.file_path ? doc.file_path.split('/').pop() : doc.document ? doc.document.split('/').pop() : 'No file'}
                                                    </p>
                                                    {doc.document_type && (
                                                        <Badge variant="secondary" className="mt-2 text-xs">
                                                            {doc.document_type}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {(doc.file_path || doc.document) && (
                                                    <a
                                                        href={getImagePath(doc.file_path || doc.document)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 border dark:border-gray-800"
                                                    >
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    </a>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>{t('No documents uploaded.')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}