import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { usePageButtons } from '@/hooks/usePageButtons';
import { Card, CardContent } from '@/components/ui/card';

import AuthenticatedLayout from '@/layouts/authenticated-layout';
import LeadSidebar from './LeadSidebar';
import General from './General';
import Activity from './Activity';
import Tasks from './Tasks/Index';
import Users from './Users/Index';
import Products from './Products/Index';
import Sources from './Sources/Index';
import Calls from './Calls/Index';
import Files from './Files';
import ConvertToDeal from './ConvertToDeal';
import { Lead } from '../types';

interface ShowLeadProps {
    lead: Lead;
    deal?: {
        id: number;
        is_active: boolean;
    };
}

export default function Show() {
    const { lead, deal } = usePage<ShowLeadProps>().props;
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState('general');
    const videoHubButtons = usePageButtons('leadShowButtons', { lead });
    const spreadsheetButtons = usePageButtons('spreadsheetBtn', { module: 'Lead', id: lead.id });
    const businessProcessMappingButtons = usePageButtons('businessProcessMappingBtn', { module: 'Lead', submodule: 'Lead', id: lead.id });

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'general':   return <General lead={lead} />;
            case 'tasks':     return <Tasks lead={lead} />;
            case 'users':     return <Users lead={lead} />;
            case 'products':  return <Products lead={lead} />;
            case 'sources':   return <Sources lead={lead} />;
            case 'calls':     return <Calls lead={lead} />;
            case 'files':     return <Files lead={lead} />;
            case 'activity':  return <Activity lead={lead} />;
            default:          return null;
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('CRM'), url: route('lead.index') },
                { label: t('Leads'), url: route('lead.leads.index') },
                { label: lead.name }
            ]}
            pageTitle={t('CRM Details')}
            pageDescription={t('View details, activities, emails, and tasks related to this lead.')}
            backUrl={route('lead.leads.index')}
            pageActions={
                <div className="flex items-center gap-2">
                    {videoHubButtons && videoHubButtons.length > 0 && (
                        <div className="flex items-center gap-2">
                            {videoHubButtons.map((button, index) => (
                                <div key={button.id || index}>{button.component}</div>
                            ))}
                        </div>
                    )}
                    {spreadsheetButtons && spreadsheetButtons.length > 0 && (
                        <div className="flex items-center gap-2">
                            {spreadsheetButtons.map((button, index) => (
                                <div key={button.id || index}>{button.component}</div>
                            ))}
                        </div>
                    )}
                    {businessProcessMappingButtons && businessProcessMappingButtons.length > 0 && (
                        <div className="flex items-center gap-2">
                            {businessProcessMappingButtons.map((button, index) => (
                                <div key={button.id || index}>{button.component}</div>
                            ))}
                        </div>
                    )}
                    <ConvertToDeal lead={lead} deal={deal} />
                </div>
            }
        >
            <Head title={`${lead.name} - ${t('Lead Details')}`} />

            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-56 flex-shrink-0">
                    <LeadSidebar activeItem={activeSection} onSectionChange={setActiveSection} />
                </div>
                <div className="flex-1">
                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            {renderSectionContent()}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
