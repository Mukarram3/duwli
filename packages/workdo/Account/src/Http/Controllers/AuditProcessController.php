<?php
// packages/workdo/Account/src/Http/Controllers/AuditProcessController.php

namespace Workdo\Account\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Account\Models\AuditProcessItem;

/**
 * The audit process queue.
 *
 * One endpoint serves every document type. Rather than accept a class name
 * from the browser — which would let anyone queue any model in the
 * application — the request sends a short type key that is resolved against
 * this whitelist.
 */
class AuditProcessController extends Controller
{
    /** Document types that may be sent for audit. */
    private const AUDITABLE = [
        'debit_note'      => \Workdo\Account\Models\DebitNote::class,
        'credit_note'     => \Workdo\Account\Models\CreditNote::class,
        'journal_entry'   => \Workdo\Account\Models\JournalEntry::class,
        'sales_invoice'   => \App\Models\SalesInvoice::class,
        'purchase_invoice' => \App\Models\PurchaseInvoice::class,
    ];

    public function index(Request $request)
    {
        if (!Auth::user()->can('manage-audit-process')) {
            return back()->with('error', __('Permission denied'));
        }

        $query = AuditProcessItem::with(['addedBy:id,name', 'reviewedBy:id,name'])
            ->where('created_by', creatorId());

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $query->where('reference', 'like', '%' . $request->search . '%');
        }

        return Inertia::render('Account/AuditProcess/Index', [
            'items'   => $query->latest()->paginate($request->per_page ?? 15)->withQueryString(),
            'filters' => $request->only(['status', 'search', 'per_page']),
            'counts'  => [
                'pending'   => AuditProcessItem::where('created_by', creatorId())->where('status', 'pending')->count(),
                'in_review' => AuditProcessItem::where('created_by', creatorId())->where('status', 'in_review')->count(),
                'approved'  => AuditProcessItem::where('created_by', creatorId())->where('status', 'approved')->count(),
                'rejected'  => AuditProcessItem::where('created_by', creatorId())->where('status', 'rejected')->count(),
            ],
        ]);
    }

    /** Add one or more documents to the queue. */
    public function store(Request $request)
    {
        if (!Auth::user()->can('create-audit-process')) {
            return back()->with('error', __('Permission denied'));
        }

        $validated = $request->validate([
            'type' => ['required', 'string', 'in:' . implode(',', array_keys(self::AUDITABLE))],
            'ids'  => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $model = self::AUDITABLE[$validated['type']];

        $documents = $model::whereIn('id', $validated['ids'])
            ->where('created_by', creatorId())
            ->get();

        if ($documents->isEmpty()) {
            return back()->with('error', __('No matching documents were found.'));
        }

        $added = 0;
        $already = 0;

        foreach ($documents as $document) {
            $exists = AuditProcessItem::where('auditable_type', $model)
                ->where('auditable_id', $document->id)
                ->where('created_by', creatorId())
                ->exists();

            if ($exists) {
                $already++;
                continue;
            }

            AuditProcessItem::create([
                'auditable_type' => $model,
                'auditable_id'   => $document->id,
                'reference'      => $this->referenceFor($document),
                'amount'         => $document->total_amount ?? $document->total_debit ?? 0,
                'status'         => 'pending',
                'note'           => $validated['note'] ?? null,
                'added_by'       => Auth::id(),
                'creator_id'     => Auth::id(),
                'created_by'     => creatorId(),
            ]);

            $added++;
        }

        if ($added === 0) {
            return back()->with('error', __('Already in the audit process.'));
        }

        $message = __(':count document(s) added to the audit process.', ['count' => $added]);
        if ($already > 0) {
            $message .= ' ' . __(':count were already in the queue.', ['count' => $already]);
        }

        return back()->with('success', $message);
    }

    /** Move an item through the review states. */
    public function update(Request $request, AuditProcessItem $auditProcessItem)
    {
        if (!Auth::user()->can('review-audit-process') || $auditProcessItem->created_by != creatorId()) {
            return back()->with('error', __('Permission denied'));
        }

        $validated = $request->validate([
            'status'        => ['required', 'in:pending,in_review,approved,rejected'],
            'reviewer_note' => ['nullable', 'string', 'max:500'],
        ]);

        $auditProcessItem->update([
            'status'        => $validated['status'],
            'reviewer_note' => $validated['reviewer_note'] ?? $auditProcessItem->reviewer_note,
            'reviewed_by'   => Auth::id(),
            'reviewed_at'   => now(),
        ]);

        return back()->with('success', __('Audit item updated.'));
    }

    /** Remove an item from the queue. The source document is untouched. */
    public function destroy(AuditProcessItem $auditProcessItem)
    {
        if (!Auth::user()->can('delete-audit-process') || $auditProcessItem->created_by != creatorId()) {
            return back()->with('error', __('Permission denied'));
        }

        $auditProcessItem->delete();

        return back()->with('success', __('Removed from the audit process.'));
    }

    /** Whatever this document calls its number. */
    private function referenceFor($document): string
    {
        foreach (['debit_note_number', 'credit_note_number', 'journal_number',
                  'invoice_number', 'purchase_invoice_number', 'reference'] as $field) {
            if (!empty($document->{$field})) {
                return (string) $document->{$field};
            }
        }

        return '#' . $document->id;
    }
}
