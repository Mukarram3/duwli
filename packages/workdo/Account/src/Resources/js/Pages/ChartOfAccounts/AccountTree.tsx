// packages/workdo/Account/src/Resources/js/Pages/ChartOfAccounts/AccountTree.tsx
import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    ChevronRight, ChevronDown, Eye, Edit as EditIcon, Trash2,
    Folder, FileText, Plus, Check, X,
} from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { RowActions } from '@/components/row-actions';
import { Input } from '@/components/ui/input';
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
    is_group: boolean;
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
    /** Create a sub-account beneath this one. */
    onAddChild?: (parent: TreeAccount) => void;
    /** Renders name and code as inline inputs for fast bulk correction. */
    quickEdit?: boolean;
};

export default function AccountTree({
    nodes,
    expandedIds,
    onToggle,
    permissions,
    onEdit,
    onDelete,
    onAddChild,
    quickEdit = false,
}: Props) {
    const { t } = useTranslation();

    // Which row is being edited inline, and its working values.
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<{ account_name: string; account_code: string }>({
        account_name: '',
        account_code: '',
    });
    const [saving, setSaving] = useState(false);

    const beginEdit = (node: TreeAccount) => {
        setEditingId(node.id);
        setDraft({ account_name: node.account_name, account_code: node.account_code });
    };

    const cancelEdit = () => setEditingId(null);

    /**
     * Saves just name and code. Everything else on the account is left alone,
     * so a quick correction cannot silently change an account's type, parent
     * or balance — which is exactly the risk with inline editing.
     */
    const saveEdit = (node: TreeAccount) => {
        if (!draft.account_name.trim() || !draft.account_code.trim()) return;

        setSaving(true);
        router.put(
            route('account.chart-of-accounts.update', node.id),
            {
                account_name: draft.account_name.trim(),
                account_code: draft.account_code.trim(),
                account_type_id: (node as any).account_type_id,
                normal_balance: node.normal_balance,
                parent_account_id: node.parent_account_id,
                is_group: node.is_group,
                opening_balance: node.opening_balance,
                current_balance: node.current_balance,
                is_active: node.is_active,
                description: node.description,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSaving(false);
                    setEditingId(null);
                },
            },
        );
    };

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

                                        {node.is_group ? (
                                            <Folder className="h-4 w-4 shrink-0 text-amber-500" />
                                        ) : (
                                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        )}

                                        {editingId === node.id ? (
                                            <Input
                                                value={draft.account_name}
                                                onChange={(e) =>
                                                    setDraft({ ...draft, account_name: e.target.value })
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit(node);
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                                autoFocus
                                                className="h-8 w-56"
                                            />
                                        ) : (
                                            <span
                                                className={cn(
                                                    node.is_group && 'font-semibold',
                                                    quickEdit && 'cursor-text rounded px-1 hover:bg-muted',
                                                )}
                                                onClick={() => quickEdit && beginEdit(node)}
                                            >
                                                {node.account_name}
                                            </span>
                                        )}

                                        {hasChildren && (
                                            <span className="ml-1 rounded bg-muted px-1.5 text-xs text-muted-foreground">
                                                {node.children.length}
                                            </span>
                                        )}

                                        {node.is_group && !hasChildren && (
                                            <span className="ml-1 rounded bg-amber-100 px-1.5 text-xs text-amber-700">
                                                {t('Empty group')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                                    {editingId === node.id ? (
                                        <div className="flex items-center gap-1">
                                            <Input
                                                value={draft.account_code}
                                                onChange={(e) =>
                                                    setDraft({ ...draft, account_code: e.target.value })
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit(node);
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                                className="h-8 w-24"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={saving}
                                                onClick={() => saveEdit(node)}
                                                className="h-8 w-8 p-0 text-emerald-600"
                                                title={t('Save')}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={cancelEdit}
                                                className="h-8 w-8 p-0"
                                                title={t('Cancel')}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <span
                                            className={cn(quickEdit && 'cursor-text rounded px-1 hover:bg-muted')}
                                            onClick={() => quickEdit && beginEdit(node)}
                                        >
                                            {node.account_code}
                                        </span>
                                    )}
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
                                        {/*
                                          The same four icons on every row.
                                          Previously Edit and Delete were hidden
                                          on rows that did not allow them, so one
                                          row showed two icons and the next showed
                                          five, and the column read as broken.
                                          Now unavailable actions are greyed out
                                          with a reason instead of disappearing.
                                        */}
                                        <RowActions
                                            className="justify-end"
                                            actions={[
                                                {
                                                    label: t('Add sub-account'),
                                                    icon: Plus,
                                                    className: 'text-[#1E3A6F]',
                                                    permitted: canEdit && !!onAddChild,
                                                    onClick: () => onAddChild && onAddChild(node),
                                                },
                                                {
                                                    label: t('View'),
                                                    icon: Eye,
                                                    className: 'text-green-600',
                                                    permitted: canView,
                                                    onClick: () =>
                                                        router.visit(route('account.chart-of-accounts.show', node.id)),
                                                },
                                                {
                                                    // System accounts ARE editable — you need to
                                                    // rename them and set parents to build the
                                                    // hierarchy. Only deletion is restricted.
                                                    label: t('Edit'),
                                                    icon: EditIcon,
                                                    className: 'text-blue-600',
                                                    permitted: canEdit,
                                                    onClick: () => onEdit(node),
                                                },
                                                {
                                                    label: t('Delete'),
                                                    icon: Trash2,
                                                    className: 'text-destructive',
                                                    permitted: canDelete,
                                                    available:
                                                        node.is_system_account == 0 &&
                                                        node.children.length === 0,
                                                    disabledReason:
                                                        node.children.length > 0
                                                            ? t('Move or delete the sub-accounts first.')
                                                            : t('System accounts cannot be deleted.'),
                                                    onClick: () => onDelete(node.id),
                                                },
                                            ]}
                                        />
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
