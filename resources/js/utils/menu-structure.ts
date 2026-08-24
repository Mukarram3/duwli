// resources/js/utils/menu-structure.ts
import { NavItem } from '@/types';
import { DEMOTED_ROUTES } from '@/utils/page-actions';
import {
    LayoutGrid,
    Receipt,
    ShoppingCart,
    Calculator,
    Building2,
    Boxes,
    UserCog,
    Contact,
    FolderKanban,
    BarChart3,
    Settings as SettingsIcon,
    MoreHorizontal,
} from 'lucide-react';

/**
 * QOYOD-STYLE SIDEBAR TAXONOMY
 * ----------------------------------------------------------------------------
 * The core menu and every workdo package each declare their own top-level
 * entries. This layer ignores those groupings and re-files every *leaf* item
 * into the fixed structure below, so the sidebar reads the same regardless of
 * which packages are activated.
 *
 * Matching is done on resolved route names (not titles), so it is unaffected by
 * the active language.
 *
 * Anything that cannot be matched is appended to the END of the section its
 * original module belonged to (see SOURCE_GROUP_FALLBACK), so no menu item is
 * ever lost when a new package is installed.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

declare const route: ((name: string) => string) | undefined;

/** Resolve a route name to a pathname. Returns null if the route is unknown. */
const path = (routeName: string): string | null => {
    try {
        if (typeof route !== 'function') return null;
        const url = route(routeName);
        if (!url) return null;
        return url.startsWith('http') ? new URL(url).pathname : url.split('?')[0];
    } catch {
        return null;
    }
};

/** Normalise an href already present on a NavItem into a pathname. */
const hrefPath = (href?: string): string | null => {
    if (!href) return null;
    try {
        return href.startsWith('http') ? new URL(href).pathname : href.split('?')[0];
    } catch {
        return href;
    }
};

// ---------------------------------------------------------------------------
// Section definitions
// ---------------------------------------------------------------------------

type SubGroup = {
    /** Translation key for the sub-dropdown label. Omit to place items directly in the section. */
    title?: string;
    /** Route names, in the order they should appear. */
    routes: string[];
};

type Section = {
    name: string;
    title: string;
    icon: any;
    groups: SubGroup[];
};

const SECTIONS: Section[] = [
    // ── SALES | المبيعات ────────────────────────────────────────────────────
    {
        name: 'sales',
        title: 'Sales',
        icon: Receipt,
        groups: [
            {
                routes: [
                    'account.customers.index',
                    'sales-invoices.index',
                    'sales-returns.index',
                    'quotations.index',
                    'sales-proposals.index',
                    'account.customer-payments.index',
                    'account.credit-notes.index',
                    'account.revenues.index',
                ],
            },
            {
                title: 'Contracts & Docs',
                routes: ['contract.index', 'contract-types.index'],
            },
            {
                title: 'Point of Sale',
                routes: ['pos.create', 'pos.orders', 'pos.barcode'],
            },
        ],
    },

    // ── PURCHASING | المشتريات ──────────────────────────────────────────────
    {
        name: 'purchasing',
        title: 'Purchasing',
        icon: ShoppingCart,
        groups: [
            {
                routes: [
                    'account.vendors.index',
                    'purchase-invoices.index',
                    'purchase-returns.index',
                    'account.vendor-payments.index',
                    'account.debit-notes.index',
                    'account.expenses.index',
                ],
            },
        ],
    },

    // ── ACCOUNTING | الحسابات ───────────────────────────────────────────────
    {
        name: 'accounting',
        title: 'Accounting',
        icon: Calculator,
        groups: [
            {
                routes: ['account.chart-of-accounts.index', 'account.journal-entries.index'],
            },
            {
                title: 'Bank Management',
                routes: [
                    'account.bank-accounts.index',
                    'account.bank-transactions.index',
                    'account.bank-transfers.index',
                ],
            },
            {
                title: 'Budget',
                routes: [
                    'budget-planner.budgets.index',
                    'budget-planner.budget-monitorings.index',
                    'budget-planner.budget-allocations.index',
                    'budget-planner.budget-periods.index',
                ],
            },
            {
                title: 'Goals',
                routes: [
                    'goal.goals.index',
                    'goal.milestones.index',
                    'goal.tracking.index',
                    'goal.contributions.index',
                    'goal.categories.index',
                ],
            },
            {
                routes: ['account.account-types.index'],
            },
        ],
    },

    // ── FIXED ASSETS | الأصول الثابتة ───────────────────────────────────────
    // Provided by the WorkDo "Assets" package.
    {
        name: 'fixed-assets',
        title: 'Fixed Assets',
        icon: Building2,
        groups: [
            {
                routes: [
                    'assets.assets.index',
                    'assets.asset-assignments.index',
                    'assets.asset-locations.index',
                    'assets.asset-maintenance.index',
                    'assets.asset-depreciation.index',
                    'assets.categories.index',
                ],
            },
        ],
    },

    // ── INVENTORY CONTROL | إدارة المخزون ───────────────────────────────────
    {
        name: 'inventory',
        title: 'Inventory Control',
        icon: Boxes,
        groups: [
            {
                routes: [
                    'product-service.items.index',
                    'warehouses.index',
                    'transfers.index',
                    'product-service.item-categories.index',
                ],
            },
        ],
    },

    // ── HR | الموارد البشرية ────────────────────────────────────────────────
    // HRM ships 38 routes in a single flat module and Recruitment another 23.
    // They are grouped here by what an HR user actually does, and the employee
    // lifecycle (promotions, transfers, warnings, resignations, terminations,
    // awards, documents) is demoted to the Employees page action bar — see
    // page-actions.ts.
    {
        name: 'hr',
        title: 'HR',
        icon: UserCog,
        groups: [
            {
                routes: ['hrm.employees.index'],
            },
            // Time Management (Attendances, Shifts, Timesheet, Holidays) is no
            // longer a sidebar dropdown — those four live as buttons on the
            // Employees page. See page-actions.ts.
            // Leave Balance and Leave Types are buttons on the Leave
            // Applications page, so only that page needs a sidebar row.
            {
                routes: ['hrm.leave-applications.index'],
            },
            // Set Salary is a button on the Payrolls page.
            {
                routes: ['hrm.payrolls.index'],
            },
            {
                routes: ['hrm.announcements.index', 'hrm.events.index'],
            },
            // Recruitment is one row: candidates, interviews and offers are
            // buttons on the Job Postings page.
            {
                routes: ['recruitment.job-postings.index'],
            },
            // Trainers and Training Types are buttons on the Training List.
            {
                routes: ['training.trainings.index'],
            },
            // Goals, cycles and indicators are buttons on Employee Reviews.
            {
                routes: ['performance.employee-reviews.index'],
            },
            {
                title: 'System Setup',
                routes: [
                    'hrm.working-days.index',
                    'hrm.branches.index',
                    'hrm.departments.index',
                    'hrm.designations.index',
                    'hrm.allowance-types.index',
                    'hrm.deduction-types.index',
                    'hrm.loan-types.index',
                    'hrm.employee-document-types.index',
                    'hrm.award-types.index',
                    'hrm.termination-types.index',
                    'hrm.warning-types.index',
                    'hrm.complaint-types.index',
                    'hrm.holiday-types.index',
                    'hrm.document-categories.index',
                    'hrm.announcement-categories.index',
                    'hrm.event-types.index',
                    'hrm.ip-restricts.index',
                    'performance.indicator-categories.index',
                    'performance.goal-types.index',
                    'recruitment.job-types.index',
                    'recruitment.candidate-sources.index',
                    'recruitment.interview-types.index',
                    'recruitment.interview-rounds.index',
                    'recruitment.checklist-items.index',
                    'recruitment.onboarding-checklists.index',
                    'recruitment.job-locations.index',
                    'recruitment.custom-questions.index',
                    'recruitment.settings.index',
                    'recruitment.about-company.index',
                    'recruitment.application-tips.index',
                    'recruitment.what-happens-next.index',
                    'recruitment.need-help.index',
                    'recruitment.tracking-faq.index',
                    'recruitment.offer-letter-template.index',
                ],
            },
        ],
    },

    // ── CRM | إدارة علاقات العملاء ──────────────────────────────────────────
    {
        name: 'crm',
        title: 'CRM',
        icon: Contact,
        groups: [
            {
                routes: ['lead.leads.index', 'lead.deals.index', 'lead.pipelines.index'],
            },
            {
                title: 'Communication',
                routes: [
                    'messenger.index',
                    'zoommeeting.zoom-meetings.index',
                    'calendar.view.index',
                ],
            },
            {
                title: 'Support Management',
                routes: [
                    'support-tickets.index',
                    'helpdesk-tickets.index',
                    'support-ticket-knowledge.index',
                    'support-ticket-faq.index',
                    'support-ticket-contact.index',
                    'ticket-category.index',
                ],
            },
        ],
    },

    // ── PROJECTS AND TASKS | المشاريع والمهام ───────────────────────────────
    {
        name: 'projects',
        title: 'Projects and Tasks',
        icon: FolderKanban,
        groups: [
            {
                routes: [
                    'project.index',
                    'project.task-stages.index',
                    'formbuilder.forms.index',
                ],
            },
        ],
    },

    // ── REPORTS | التقارير ──────────────────────────────────────────────────
    // Every report in the application lands here, in one section.
    {
        name: 'reports',
        title: 'Reports',
        icon: BarChart3,
        groups: [
            {
                title: 'Financial Reports',
                routes: [
                    'double-entry.trial-balance.index',
                    'double-entry.balance-sheets.index',
                    'double-entry.profit-loss.index',
                    'double-entry.ledger-summary.index',
                    'double-entry.reports.index',
                    'account.reports.index',
                ],
            },
            {
                title: 'Sales Reports',
                routes: ['pos.reports.sales', 'pos.reports.products', 'pos.reports.customers'],
            },
            {
                title: 'CRM Reports',
                routes: ['lead.reports.leads', 'lead.reports.deals', 'lead.reports.index'],
            },
            {
                title: 'Operation Reports',
                routes: ['project.report.index'],
            },
        ],
    },

    // ── SETTINGS | الإعدادات ────────────────────────────────────────────────
    {
        name: 'settings',
        title: 'Settings',
        icon: SettingsIcon,
        groups: [
            {
                routes: ['settings.index'],
            },
            {
                title: 'User Management',
                routes: ['users.index', 'roles.index', 'users.login-history'],
            },
            {
                title: 'Subscription',
                routes: ['plans.index', 'bank-transfer.index', 'orders.index'],
            },
            {
                title: 'CMS',
                routes: [
                    'landing-page.index',
                    'custom-pages.index',
                    'newsletter-subscribers.index',
                    'marketplace.settings',
                ],
            },
            {
                routes: ['media-library'],
            },
        ],
    },
];

/** Section that unmatched items fall back to, keyed by the module's original group. */
const SOURCE_GROUP_FALLBACK: Record<string, string> = {
    'Sales & Revenue': 'sales',
    'Purchase & Inventory': 'inventory',
    'Accounting & Finance': 'accounting',
    'HR Management': 'hr',
    'Project Management': 'projects',
    'Support & Communication': 'crm',
    System: 'settings',
};

/**
 * Path-prefix routing. Any leaf whose URL starts with one of these prefixes is
 * filed into the named section regardless of which module emitted it or what
 * its route is called. This is how Fixed Assets works: WorkDo ships the module
 * as "FixEquipment", and installing it makes the section appear with no code
 * change here.
 */
const SECTION_PATH_PREFIXES: Array<{ prefix: RegExp; section: string }> = [
    { prefix: /^\/(fix-?equipment|fixed-?assets?|asset-?management)/i, section: 'fixed-assets' },
    { prefix: /^\/(inventory|stock|production|warehouse)/i, section: 'inventory' },
];

/** Anything whose path looks like a report is pulled into the Reports section. */
const REPORT_PATH_PATTERNS = [/\/reports?(\/|$)/i, /\/report-/i, /\/trial-balance/i, /\/balance-sheet/i, /\/profit-loss/i, /\/ledger-summary/i];

const looksLikeReport = (p: string | null): boolean =>
    !!p && REPORT_PATH_PATTERNS.some((re) => re.test(p));

// ---------------------------------------------------------------------------
// Transformer
// ---------------------------------------------------------------------------

type Leaf = { item: NavItem; path: string | null; sourceGroup: string };

/**
 * Recursively collect every clickable leaf beneath an item.
 * An item that has BOTH an href and children (e.g. CRM > Reports) contributes
 * its own link as well as its children, so no destination is dropped.
 */
const collectLeaves = (item: NavItem, sourceGroup: string, out: Leaf[]): void => {
    if (item.href) {
        out.push({
            item: { ...item, children: undefined, parent: undefined, group: undefined },
            path: hrefPath(item.href),
            sourceGroup,
        });
    }
    if (item.children && item.children.length > 0) {
        item.children.forEach((child) => collectLeaves(child, sourceGroup, out));
    }
};

/**
 * Turn '/double-entry/reports' into 'Double Entry' — used to disambiguate
 * identically-named items that end up as siblings (several modules ship an
 * item simply called "Reports").
 */
const moduleHint = (href?: string): string => {
    const p = hrefPath(href);
    if (!p) return '';
    const segment = p.split('/').filter(Boolean)[0] || '';
    return segment
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

/**
 * nav-main.tsx keys menu entries on their title, so duplicate titles inside one
 * dropdown would collide. Suffix repeats with their module name.
 */
const dedupeTitles = (items: NavItem[]): NavItem[] => {
    const seen = new Map<string, number>();
    items.forEach((i) => seen.set(i.title, (seen.get(i.title) || 0) + 1));

    return items.map((item) => {
        const isDuplicate = (seen.get(item.title) || 0) > 1;
        const hint = isDuplicate ? moduleHint(item.href) : '';
        return {
            ...item,
            title: hint ? `${item.title} — ${hint}` : item.title,
            children: item.children ? dedupeTitles(item.children) : undefined,
        };
    });
};

/**
 * Re-file every menu leaf into the Qoyod section structure.
 * The Dashboard item (and any package dashboards nested under it) is preserved
 * as-is at the top.
 */
export const applyQoyodStructure = (items: NavItem[]): NavItem[] => {
    // 1. Pull the dashboard out untouched.
    const dashboard = items.find((i) => i.name === 'dashboard');
    const rest = items.filter((i) => i.name !== 'dashboard');

    // 2. Flatten everything else into leaves.
    const leaves: Leaf[] = [];
    rest.forEach((item) => collectLeaves(item, item.group || '', leaves));

    // 3. Index leaves by pathname (first occurrence wins).
    const byPath = new Map<string, Leaf>();
    leaves.forEach((leaf) => {
        if (leaf.path && !byPath.has(leaf.path)) byPath.set(leaf.path, leaf);
    });

    const consumed = new Set<Leaf>();

    // Routes that live on a page action bar are removed from the sidebar. This
    // is what keeps the nav short — see page-actions.ts for where each one went.
    const demotedPaths = new Set(
        DEMOTED_ROUTES.map((name) => path(name)).filter((p): p is string => !!p),
    );
    leaves.forEach((leaf) => {
        if (leaf.path && demotedPaths.has(leaf.path)) consumed.add(leaf);
    });

    const take = (routeName: string): NavItem | null => {
        const p = path(routeName);
        if (!p) return null;
        const leaf = byPath.get(p);
        if (!leaf || consumed.has(leaf)) return null;
        consumed.add(leaf);
        return leaf.item;
    };

    // 4. Build each section from its declared route lists.
    const built = new Map<string, NavItem[]>();
    SECTIONS.forEach((section) => {
        const children: NavItem[] = [];

        section.groups.forEach((group) => {
            const found = group.routes
                .map(take)
                .filter((x): x is NavItem => x !== null);

            if (found.length === 0) return;

            if (group.title) {
                children.push({ title: group.title, children: found });
            } else {
                children.push(...found);
            }
        });

        built.set(section.name, children);
    });

    // 5. Sweep every remaining report into the Reports section.
    const reportChildren = built.get('reports') || [];
    const strayReports: NavItem[] = [];
    leaves.forEach((leaf) => {
        if (consumed.has(leaf)) return;
        if (!looksLikeReport(leaf.path)) return;
        consumed.add(leaf);
        strayReports.push(leaf.item);
    });
    if (strayReports.length > 0) {
        reportChildren.push({ title: 'Other Reports', children: strayReports });
        built.set('reports', reportChildren);
    }

    // 6. Route by path prefix — catches modules installed later (Fixed Assets).
    leaves.forEach((leaf) => {
        if (consumed.has(leaf) || !leaf.path) return;
        const rule = SECTION_PATH_PREFIXES.find((r) => r.prefix.test(leaf.path!));
        if (!rule || !built.has(rule.section)) return;
        consumed.add(leaf);
        built.get(rule.section)!.push(leaf.item);
    });

    // 7. Unmatched items go to the END of their module's fallback section.
    const orphans: NavItem[] = [];
    leaves.forEach((leaf) => {
        if (consumed.has(leaf)) return;
        consumed.add(leaf);
        const target = SOURCE_GROUP_FALLBACK[leaf.sourceGroup];
        if (target && built.has(target)) {
            built.get(target)!.push(leaf.item);
        } else {
            orphans.push(leaf.item);
        }
    });

    // 8. Emit. Empty sections are dropped.
    const output: NavItem[] = [];

    if (dashboard) {
        output.push({ ...dashboard, icon: dashboard.icon || LayoutGrid, group: '', order: 1 });
    }

    SECTIONS.forEach((section, index) => {
        const children = built.get(section.name) || [];
        if (children.length === 0) return;

        /**
         * Every section gets an Overview row pointing at its hub page, which
         * lists every function in the section as an icon card — including the
         * ones demoted to page action bars. Without it, a demoted screen is
         * only reachable by knowing which page it sits on.
         */
        const overviewHref = path('section.hub')
            ? `/section/${section.name}`
            : null;

        const withOverview = overviewHref
            ? [
                  {
                      title: 'Overview',
                      href: overviewHref,
                      icon: LayoutGrid,
                      activePaths: [`/section/${section.name}`],
                  } as NavItem,
                  ...children,
              ]
            : children;

        output.push({
            title: section.title,
            icon: section.icon,
            name: section.name,
            group: '',
            order: (index + 1) * 100,
            children: dedupeTitles(withOverview),
        });
    });

    if (orphans.length > 0) {
        output.push({
            title: 'Other',
            icon: MoreHorizontal,
            name: 'other',
            group: '',
            order: 9999,
            children: orphans,
        });
    }

    return output;
};

/**
 * Translate the section and sub-group labels introduced by this layer.
 * Leaf items already came through t() in their own module, so only the
 * container nodes (which never carry an href) are translated here.
 */
export const translateStructure = (items: NavItem[], t: (key: string) => string): NavItem[] =>
    items.map((item) => ({
        ...item,
        title: item.href ? item.title : t(item.title),
        children: item.children ? translateStructure(item.children, t) : undefined,
    }));
