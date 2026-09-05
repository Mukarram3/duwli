import * as React from "react";
import { PropsWithChildren, ReactNode, Fragment } from "react";
import {AppSidebar} from "@/components/app-sidebar";
import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar";
import {Separator} from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NavUser } from "@/components/nav-user";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { BrandProvider, useBrand } from "@/contexts/brand-context";
import CookieConsent from "@/components/cookie-consent";
import { useFavicon } from "@/hooks/use-favicon";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";
import { useFlashMessages } from "@/hooks/useFlashMessages";
import { PageHeader, type ExportOption } from "@/components/duwli/page-header";

/**
 * Props shared by the layout and its inner content component.
 *
 * Everything from `pageIcon` down is NEW and OPTIONAL — the 295 screens that
 * already pass only pageTitle/pageDescription/pageActions/backUrl are
 * unaffected, and pick up the improved header automatically.
 */
type LayoutProps = {
    header?: ReactNode;
    breadcrumbs?: Array<{label: string, url?: string}>;
    pageTitle?: string;
    pageDescription?: ReactNode;
    pageActions?: ReactNode;
    backUrl?: string;
    className?: string;

    /** Tinted icon square beside the page title. */
    pageIcon?: React.ComponentType<{ className?: string }>;
    /** Record count chip beside the page title. */
    pageCount?: number;
    /** Extra entries for the header Export menu. */
    pageExports?: ExportOption[];
    /** Adds "Download as Excel" to the header Export menu. */
    onExportExcel?: () => void;
    /** Adds "Download as PDF" to the header Export menu. */
    onExportPdf?: () => void;
    /** Adds a Print button to the header toolbar. */
    onPrint?: () => void;
};

function AuthenticatedLayoutContent({
    header,
    children,
    breadcrumbs,
    pageTitle,
    pageDescription,
    pageActions,
    backUrl,
    pageIcon,
    pageCount,
    pageExports,
    onExportExcel,
    onExportPdf,
    onPrint,
    className,
    ...props
}: PropsWithChildren<LayoutProps>) {
    const { t } = useTranslation();
    const { auth, companyAllSetting, adminAllSetting } = usePage<PageProps>().props as any;
    const { settings } = useBrand();
    useFavicon();
    useFlashMessages();

    return (
        <>
        <Head>
            {companyAllSetting?.metaKeywords && (
                <meta name="keywords" content={companyAllSetting.metaKeywords} />
            )}
            {companyAllSetting?.metaDescription && (
                <meta name="description" content={companyAllSetting.metaDescription} />
            )}
            {companyAllSetting?.metaImage && (
                <meta property="og:image" content={companyAllSetting.metaImage} />
            )}
        </Head>
        <div
            className={settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr'}
            data-theme={settings.themeMode}
            dir={settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr'}
            style={{ direction: settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr' }}
        >
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />

            <SidebarInset className="min-w-0 overflow-x-hidden"
                style={{ direction: settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr' }}
                dir={settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr'}
            >
                <header
                    className={`bg-background flex h-12 shrink-0 items-center gap-2 px-4 sm:px-6 lg:px-12 py-1 border-b mb-2 justify-between min-w-0`}
                    >
                    {/* Sidebar + Breadcrumb */}
                    <div className={`flex items-center gap-2 ${ settings.layoutDirection === "rtl" ? "order-2 flex-row-reverse" : "order-1" }`} >
                        {/* SidebarTrigger */}
                        <SidebarTrigger className={`-ml-1 ${ settings.layoutDirection === "rtl" ? "order-3" : "order-1" }`} />

                        {/* Separator */}
                        <Separator orientation="vertical" className="mr-2 h-4 order-2" />

                        {/* Breadcrumb */}
                        <Breadcrumb className={`${ settings.layoutDirection === "rtl" ? "order-1" : "order-3" }`} >
                            <BreadcrumbList className={`flex ${ settings.layoutDirection === "rtl" ? "justify-end" : "justify-start" }`} >
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href={route("dashboard")}>{t('Dashboard')}</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {breadcrumbs?.map((crumb, index) => (
                                <Fragment key={index}>
                                <BreadcrumbSeparator className={settings.layoutDirection === 'rtl' ? 'rotate-180' : ''} />
                                <BreadcrumbItem>
                                    {crumb.url ? (
                                    <BreadcrumbLink asChild>
                                        <Link href={crumb.url}>{crumb.label}</Link>
                                    </BreadcrumbLink>
                                    ) : (
                                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                    )}
                                </BreadcrumbItem>
                                </Fragment>
                            ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    {/* NavUser */}
                    <div
                        className={`flex items-center gap-2 ${
                        settings.layoutDirection === "rtl" ? "order-1 flex-row-reverse" : "order-2"
                        }`}
                    >
                        {/* Leave Impersonation Button */}
                        {auth.impersonating && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.post(route('users.leave-impersonation'))}
                                className="text-orange-600 border-orange-600 hover:bg-orange-50"
                            >
                                <UserX className="h-4 w-4 mr-2" />
                                {t('Leave Login As User')}
                            </Button>
                        )}
                        <NavUser user={auth.user} inHeader={true} />
                    </div>
                </header>

                {/*
                  min-w-0 is required on the main column: a flex/grid child
                  defaults to min-width:auto, so wide content (a long toolbar or
                  a table) pushes the whole page wider than the viewport and
                  produces a horizontal scrollbar on the document. Constraining
                  it here keeps overflow inside the page, where the table's own
                  overflow-x-auto can handle it.
                */}
                <main className="min-w-0 max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-12 md:pt-0 h-full">
                    {pageTitle && (
                        <PageHeader
                            title={pageTitle}
                            description={pageDescription}
                            icon={pageIcon}
                            count={pageCount}
                            exports={pageExports}
                            onExportExcel={onExportExcel}
                            onExportPdf={onExportPdf}
                            onPrint={onPrint}
                            backUrl={backUrl}
                            actions={pageActions}
                            dir={settings.layoutDirection}
                        />
                    )}
                    <div className="min-w-0 max-w-full">{children}</div>
                </main>
            </SidebarInset>
        </SidebarProvider>
        <CookieConsent settings={adminAllSetting || {}} />
        </div>
        </>
    );
}

export default function AuthenticatedLayout({
    children,
    header,
    breadcrumbs,
    pageTitle,
    pageDescription,
    pageActions,
    backUrl,
    pageIcon,
    pageCount,
    pageExports,
    onExportExcel,
    onExportPdf,
    onPrint,
    className,
    ...props
}: PropsWithChildren<LayoutProps>) {
    return (
        <BrandProvider>
            <AuthenticatedLayoutContent
                header={header}
                breadcrumbs={breadcrumbs}
                pageTitle={pageTitle}
                pageDescription={pageDescription}
                pageActions={pageActions}
                backUrl={backUrl}
                pageIcon={pageIcon}
                pageCount={pageCount}
                pageExports={pageExports}
                onExportExcel={onExportExcel}
                onExportPdf={onExportPdf}
                onPrint={onPrint}
                className={className}
                {...props}
            >
                {children}
            </AuthenticatedLayoutContent>
        </BrandProvider>
    );
}
