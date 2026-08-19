// resources/js/utils/page-actions.ts
import {
    Award,
    BadgeCheck,
    Bell,
    CalendarDays,
    ClipboardList,
    FileText,
    LogOut,
    MessageSquareWarning,
    Send,
    TrendingUp,
    UserMinus,
    Users,
    AlertTriangle,
    ArrowLeftRight,
} from 'lucide-react';
import type { PageAction } from '@/components/page-action-bar';

/**
 * RELATED ACTIONS REGISTRY — the "compact the navigation" mechanism.
 * ----------------------------------------------------------------------------
 * Qoyod keeps a short sidebar by putting related destinations on the page they
 * belong to, as rectangular buttons, instead of giving each one its own nav row.
 *
 * This registry is the single source of truth for that. Every route listed as a
 * related action here is AUTOMATICALLY REMOVED from the sidebar (see
 * DEMOTED_ROUTES below, which menu-structure.ts consumes). One list, so the two
 * can never disagree — a row cannot be both in the nav and on a button, and
 * nothing can be dropped from the nav without gaining a home.
 *
 * Keyed by the route name of the page the buttons appear on.
 */

type RelatedAction = {
    label: string;
    route: string;
    icon?: any;
    /** Push straight into the "More" dropdown rather than showing inline. */
    overflow?: boolean;
    permission?: string;
};

export const RELATED_ACTIONS: Record<string, RelatedAction[]> = {
    /**
     * HR — Employees.
     * The employee lifecycle (promotion, transfer, warning, complaint,
     * resignation, termination) was 6 separate sidebar rows plus 5 more for
     * records. All of it belongs on the employee screen.
     */
    'hrm.employees.index': [
        { label: 'Promotions', route: 'hrm.promotions.index', icon: TrendingUp, permission: 'manage-promotion' },
        { label: 'Transfers', route: 'hrm.employee-transfers.index', icon: ArrowLeftRight, permission: 'manage-transfer' },
        { label: 'Resignations', route: 'hrm.resignations.index', icon: LogOut, permission: 'manage-resignation' },
        { label: 'Terminations', route: 'hrm.terminations.index', icon: UserMinus, permission: 'manage-termination' },
        { label: 'Warnings', route: 'hrm.warnings.index', icon: AlertTriangle, overflow: true, permission: 'manage-warning' },
        { label: 'Complaints', route: 'hrm.complaints.index', icon: MessageSquareWarning, overflow: true, permission: 'manage-complaint' },
        { label: 'Awards', route: 'hrm.awards.index', icon: Award, overflow: true, permission: 'manage-award' },
        { label: 'Acknowledgments', route: 'hrm.acknowledgments.index', icon: BadgeCheck, overflow: true, permission: 'manage-acknowledgement' },
        { label: 'Documents', route: 'hrm.documents.index', icon: FileText, overflow: true, permission: 'manage-document' },
    ],

    /** HR — Announcements page absorbs the other broadcast surfaces. */
    'hrm.announcements.index': [
        { label: 'Events', route: 'hrm.events.index', icon: CalendarDays, permission: 'manage-event' },
    ],

    /**
     * Recruitment — 23 routes in the sidebar is unusable. The pipeline stays in
     * the nav; everything that happens *to a candidate* moves onto the
     * candidates screen.
     */
    'recruitment.candidates.index': [
        { label: 'Interviews', route: 'recruitment.interviews.index', icon: Users, permission: 'manage-interview' },
        { label: 'Interview Feedback', route: 'recruitment.interview-feedbacks.index', icon: ClipboardList, permission: 'manage-interview-feedback' },
        { label: 'Candidate Assessments', route: 'recruitment.candidate-assessments.index', icon: ClipboardList, overflow: true, permission: 'manage-candidate-assessment' },
        { label: 'Offers', route: 'recruitment.offers.index', icon: Send, overflow: true, permission: 'manage-offer' },
        { label: 'Candidate Onboarding', route: 'recruitment.candidate-onboardings.index', icon: BadgeCheck, overflow: true, permission: 'manage-candidate-onboarding' },
    ],

    /** Recruitment — job postings own the careers-site content. */
    'recruitment.job-postings.index': [
        { label: 'About Company', route: 'recruitment.about-company.index', icon: FileText, overflow: true },
        { label: 'Application Tips', route: 'recruitment.application-tips.index', icon: FileText, overflow: true },
        { label: 'What Happens Next', route: 'recruitment.what-happens-next.index', icon: FileText, overflow: true },
        { label: 'Need Help', route: 'recruitment.need-help.index', icon: FileText, overflow: true },
        { label: 'Tracking FAQ', route: 'recruitment.tracking-faq.index', icon: FileText, overflow: true },
        { label: 'Offer Letter Template', route: 'recruitment.offer-letter-template.index', icon: FileText, overflow: true },
    ],

    /**
     * Accounting — Journal Entries is deliberately NOT demoted here. It is a
     * primary screen (the "Add Entry" workflow) and belongs in the sidebar
     * under Accounting.
     */

    /** Sales — receipts and credit notes belong on the invoice screen. */
    'sales-invoices.index': [
        { label: 'Manage Receipts', route: 'account.customer-payments.index', permission: 'manage-customer-payments' },
        { label: 'Manage Credit Notes', route: 'account.credit-notes.index', permission: 'manage-credit-notes' },
        { label: 'Invoice Returns', route: 'sales-returns.index', permission: 'manage-sales-return-invoices' },
    ],

    /** Purchasing — mirror of the sales screen. */
    'purchase-invoices.index': [
        { label: 'Supplier Payments', route: 'account.vendor-payments.index', permission: 'manage-vendor-payments' },
        { label: 'Debit Notes', route: 'account.debit-notes.index', permission: 'manage-debit-notes' },
        { label: 'Purchase Returns', route: 'purchase-returns.index', permission: 'manage-purchase-return-invoices' },
    ],

    /** Assets — the lifecycle of an asset lives on the asset list. */
    'assets.assets.index': [
        { label: 'Assignments', route: 'assets.asset-assignments.index' },
        { label: 'Maintenance', route: 'assets.asset-maintenance.index' },
        { label: 'Depreciation', route: 'assets.asset-depreciation.index' },
        { label: 'Locations', route: 'assets.asset-locations.index', overflow: true },
        { label: 'Category', route: 'assets.categories.index', overflow: true },
    ],
};

/**
 * Pages whose PageActionBar is actually wired up in the .tsx file.
 *
 * A route is only removed from the sidebar if its parent page appears here.
 * Without this guard, adding an entry to RELATED_ACTIONS above would delete a
 * row from the nav before the button existed to replace it, making the screen
 * unreachable. Add the page here in the SAME commit that wires its action bar.
 */
export const WIRED_PAGES: string[] = [
    'sales-invoices.index',
    'hrm.employees.index',
];

/**
 * Every route that appears as a related action ON A WIRED PAGE. menu-structure.ts
 * removes these from the sidebar — they are reachable from their parent page.
 * Entries for pages not yet wired stay in the sidebar, so nothing is orphaned.
 */
export const DEMOTED_ROUTES: string[] = Object.entries(RELATED_ACTIONS)
    .filter(([pageRoute]) => WIRED_PAGES.includes(pageRoute))
    .flatMap(([, actions]) => actions)
    .map((action) => action.route);

/** Safe route resolver — returns undefined when the package is not installed. */
const resolve = (name: string): string | undefined => {
    try {
        const fn = (window as any).route;
        if (typeof fn !== 'function') return undefined;
        return fn(name);
    } catch {
        return undefined;
    }
};

/**
 * Build the PageActionBar actions for a page. Actions whose route does not
 * resolve are dropped, so an uninstalled module leaves no dead buttons.
 *
 *   const actions = getRelatedActions('hrm.employees.index', t);
 */
export const getRelatedActions = (pageRoute: string, t: (key: string) => string): PageAction[] => {
    const related = RELATED_ACTIONS[pageRoute];
    if (!related) return [];

    return related
        .map((action) => ({
            label: t(action.label),
            href: resolve(action.route),
            icon: action.icon,
            variant: 'outline' as const,
            overflow: action.overflow,
            permission: action.permission,
        }))
        .filter((action) => !!action.href);
};
