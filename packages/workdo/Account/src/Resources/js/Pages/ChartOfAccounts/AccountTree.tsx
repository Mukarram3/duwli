// packages/workdo/Account/src/Resources/js/Pages/ChartOfAccounts/AccountTree.tsx
import { useMemo } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Eye, Edit as EditIcon, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { cn } from '@/lib/utils';

/**
 * CHART OF ACCOUNTS — TREE VIEW
 * ----------------------------------------------------------------------------
 * Renders the account hierarchy as an indented, collapsible tree, the way an
 * accountant reads a chart of accounts. Expansion state is owned by the parent
 * page so that Expand All / Collapse All can act on every node at every depth
 * in one operation, regardless of what is currently rendered.
 */

export type TreeAccount = {
    id: number;
    account_code: string;
    account_name: string;
    account_type: { name: string } | null;
    normal_balance: 'debit' | 'credit';
    opening_balance: number | string | null;
    current_balance: number | string | null;
    is_active: boolean;
    is_system_account: number | boolean;
    description: string | null;
    parent_account_id: number | null;
    depth: number;
    children: TreeAccount[];
};

/** Every id in the tree, at any depth — the target set for "Expand All". */
export const collectAllIds = (nodes: TreeAccount[]): number[] =>
    nodes.flatMap((node) => [node.id, ...collectAllIds(node.children)]);

/** Ids of nodes that actually have children; leaves never need expanding. */
export const collectParentIds = (nodes: TreeAccount[]): number[] =>
    nodes.flatMap((node) =>
        node.children.length > 0 ? [node.id, ...collectParentIds(node.children)] : [],
    );

/**
 * Filter the tree by a search term, keeping any ancestor of a match so the
 * matched node is still reachable. Returns the pruned tree plus the ids that
 * must be open for every match to be visible.
 */
export const filterTree = (
    nodes: TreeAccount[],
    term: string,
): { tree: TreeAccount[]; openIds: number[] } => {
    const needle = term.trim().toLowerCase();
    if (!needle) return { tree: nodes, openIds: [] };

    const openIds: number[] = [];

    const walk = (list: TreeAccount[]): TreeAccount[] =>
        list
            .map((node) => {
                const children = walk(node.children);
                const selfMatches =
                    node.account_name.toLowerCase().includes(needle) ||
                    node.account_code.toLowerCase().includes(needle);

                if (!selfMatches && children.length === 0) return null;
                if (children.length > 0) openIds.push(node.id);

                return { ...node, children };
            })
            .filter((node): node is TreeAccount => node !== null);

    return { tree: walk(nodes), openIds };
};

type Props = {
    nodes: TreeAccount[];
    expandedIds: Set<number>;
    onToggle: (id: number) => void;
    permissions: string[];
    onEdit: (account: TreeAccount) => void;
    onDelete: (id: number) => void;
};

export default function AccountTree({
    nodes,
    expandedIds,
    onToggle,
    permissions,
    onEdit,
    onDelete,
}: Props) {
    const { t } = useTranslation();

    const canView = permissions?.includes('view-chart-of-accounts');
    const canEdit = permissions?.includes('edit-chart-of-accounts');
    const canDelete = permissions?.includes('delete-chart-of-accounts');
    const showActions = canView || canEdit || canDelete;

    /**
     * Flatten the tree into the rows that are currently visible, so the table
     * body stays a flat list of <tr> and indentation is expressed with padding.
     * Nesting real tables would break column alignment across depths.
     */
    const visibleRows = useMemo(() => {
        const rows: TreeAccount[] = [];

        const walk = (list: TreeAccount[]) => {
            list.forEach((node) => {
                rows.push(node);
                if (node.children.length > 0 && expandedIds.has(node.id)) {
                    walk(node.children);
                }
            });
        };

        walk(nodes);
        return rows;
    }, [nodes, expandedIds]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                    <tr>
                        <th className="px-4 py-3 font-medium">{t('Account Name')}</th>
                        <th className="px-4 py-3 font-medium">{t('Account Code')}</th>
                        <th className="px-4 py-3 font-medium">{t('Account Type Name')}</th>
                        <th className="px-4 py-3 font-medium">{t('Normal Balance')}</th>
                        <th className="px-4 py-3 text-right font-medium">{t('Opening Balance')}</th>
                        <th className="px-4 py-3 text-right font-medium">{t('Current Balance')}</th>
                        <th className="px-4 py-3 font-medium">{t('Status')}</th>
                        {showActions && <th className="px-4 py-3 text-right font-medium">{t('Actions')}</th>}
                    </tr>
                </thead>
                <tbody>
                    {visibleRows.map((node) => {
                        const hasChildren = node.children.length > 0;
                        const isOpen = expandedIds.has(node.id);

                        return (
                            <tr key={node.id} className="border-t hover:bg-muted/30">
                                <td className="px-4 py-2.5">
                                    <div
                                        className="flex items-center gap-1.5"
                                        // Indent by depth. Leaves get extra padding so their
                                        // names line up with siblings that have a chevron.
                                        style={{ paddingInlineStart: `${node.depth * 20}px` }}
                                    >
                                        {hasChildren ? (
                                            <button
                                                type="button"
                                                onClick={() => onToggle(node.id)}
                                                aria-label={isOpen ? t('Collapse') : t('Expand')}
                                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
                                            >
                                                {isOpen ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                                                )}
                                            </button>
                                        ) : (
                                            <span className="h-5 w-5 shrink-0" />
                                        )}

                                        <span className={cn(hasChildren && 'font-semibold')}>
                                            {node.account_name}
                                        </span>

                                        {hasChildren && (
                                            <span className="ml-1 rounded bg-muted px-1.5 text-xs text-muted-foreground">
                                                {node.children.length}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                                    {node.account_code}
                                </td>
                                <td className="px-4 py-2.5">{node.account_type?.name || '-'}</td>
                                <td className="px-4 py-2.5">
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-1 text-xs',
                                            node.normal_balance === 'debit'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-green-100 text-green-800',
                                        )}
                                    >
                                        {t(
                                            node.normal_balance.charAt(0).toUpperCase() +
                                                node.normal_balance.slice(1),
                                        )}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    {node.opening_balance ? formatCurrency(node.opening_balance) : '-'}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    {node.current_balance ? formatCurrency(node.current_balance) : '-'}
                                </td>
                                <td className="px-4 py-2.5">
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-1 text-xs',
                                            node.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800',
                                        )}
                                    >
                                        {node.is_active ? t('Active') : t('Inactive')}
                                    </span>
                                </td>
                                {showActions && (
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center justify-end gap-1">
                                            {canView && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title={t('View')}
                                                    className="h-8 w-8 p-0 text-green-600"
                                                    onClick={() =>
                                                        router.visit(
                                                            route('account.chart-of-accounts.show', node.id),
                                                        )
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {canEdit && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title={t('Edit')}
                                                    className="h-8 w-8 p-0 text-blue-600"
                                                    onClick={() => onEdit(node)}
                                                >
                                                    <EditIcon className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {canDelete && node.is_system_account == 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title={t('Delete')}
                                                    className="h-8 w-8 p-0 text-destructive"
                                                    onClick={() => onDelete(node.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
