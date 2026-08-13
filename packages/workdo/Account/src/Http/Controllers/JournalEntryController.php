<?php
// packages/workdo/Account/src/Http/Controllers/JournalEntryController.php

namespace Workdo\Account\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Account\Models\ChartOfAccount;
use Workdo\Account\Models\JournalEntry;
use Workdo\Account\Services\JournalService;

/**
 * Manual (general) journal entries.
 *
 * Automatic journals raised by invoices and payments are read-only here —
 * they are listed for audit but cannot be edited or deleted, because the
 * source document owns them. Only entries with entry_type = 'manual' can
 * be created, edited, posted and reversed from this screen.
 */
class JournalEntryController extends Controller
{
    protected $journalService;

    public function __construct(JournalService $journalService)
    {
        $this->journalService = $journalService;
    }

    public function index(Request $request)
    {
        if (!Auth::user()->can('manage-journal-entries')) {
            return back()->with('error', __('Permission denied'));
        }

        $query = JournalEntry::with(['items.account'])
            ->where('created_by', creatorId())
            ->withCount('items');

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('journal_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->entry_type) {
            $query->where('entry_type', $request->entry_type);
        }

        if ($request->date_from) {
            $query->whereDate('journal_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('journal_date', '<=', $request->date_to);
        }

        if ($request->sort) {
            $query->orderBy($request->sort, $request->direction ?? 'asc');
        } else {
            $query->orderBy('journal_date', 'desc')->orderBy('id', 'desc');
        }

        return Inertia::render('Account/JournalEntries/Index', [
            'journalEntries' => $query->paginate($request->per_page ?? 10)->withQueryString(),
            'filters'        => $request->only(['search', 'status', 'entry_type', 'date_from', 'date_to', 'per_page']),
        ]);
    }

    public function create()
    {
        if (!Auth::user()->can('create-journal-entries')) {
            return redirect()->route('account.journal-entries.index')->with('error', __('Permission denied'));
        }

        return Inertia::render('Account/JournalEntries/Create', [
            'accounts'      => $this->accountOptions(),
            'journalNumber' => JournalEntry::generateJournalNumber(),
        ]);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->can('create-journal-entries')) {
            return back()->with('error', __('Permission denied'));
        }

        $validated = $this->validateEntry($request);

        try {
            $entry = $this->journalService->createManualJournal(
                $validated,
                $request->boolean('post_immediately')
            );
        } catch (\Exception $e) {
            return back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()
            ->route('account.journal-entries.show', $entry->id)
            ->with('success', $entry->isPosted()
                ? __('Journal entry posted.')
                : __('Journal entry saved as draft.'));
    }

    public function show(JournalEntry $journalEntry)
    {
        if (!Auth::user()->can('view-journal-entries') || $journalEntry->created_by != creatorId()) {
            return redirect()->route('account.journal-entries.index')->with('error', __('Permission denied'));
        }

        $journalEntry->load(['items.account']);

        return Inertia::render('Account/JournalEntries/View', [
            'journalEntry' => $journalEntry,
        ]);
    }

    public function edit(JournalEntry $journalEntry)
    {
        if (!Auth::user()->can('edit-journal-entries') || $journalEntry->created_by != creatorId()) {
            return redirect()->route('account.journal-entries.index')->with('error', __('Permission denied'));
        }

        if ($journalEntry->entry_type !== 'manual') {
            return redirect()->route('account.journal-entries.show', $journalEntry->id)
                ->with('error', __('Automatic journal entries are controlled by their source document and cannot be edited.'));
        }

        if (!$journalEntry->isDraft()) {
            return redirect()->route('account.journal-entries.show', $journalEntry->id)
                ->with('error', __('Only draft journal entries can be edited. Reverse this entry instead.'));
        }

        $journalEntry->load(['items.account']);

        return Inertia::render('Account/JournalEntries/Create', [
            'accounts'      => $this->accountOptions(),
            'journalEntry'  => $journalEntry,
            'journalNumber' => $journalEntry->journal_number,
        ]);
    }

    public function update(Request $request, JournalEntry $journalEntry)
    {
        if (!Auth::user()->can('edit-journal-entries') || $journalEntry->created_by != creatorId()) {
            return back()->with('error', __('Permission denied'));
        }

        $validated = $this->validateEntry($request);

        try {
            $entry = $this->journalService->updateManualJournal($journalEntry, $validated);
            if ($request->boolean('post_immediately')) {
                $this->journalService->postManualJournal($entry);
            }
        } catch (\Exception $e) {
            return back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()
            ->route('account.journal-entries.show', $entry->id)
            ->with('success', __('Journal entry updated.'));
    }

    public function post(JournalEntry $journalEntry)
    {
        if (!Auth::user()->can('post-journal-entries') || $journalEntry->created_by != creatorId()) {
            return back()->with('error', __('Permission denied'));
        }

        try {
            $this->journalService->postManualJournal($journalEntry);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('Journal entry posted. Account balances updated.'));
    }

    public function reverse(JournalEntry $journalEntry)
    {
        if (!Auth::user()->can('post-journal-entries') || $journalEntry->created_by != creatorId()) {
            return back()->with('error', __('Permission denied'));
        }

        if ($journalEntry->entry_type !== 'manual') {
            return back()->with('error', __('Automatic journal entries must be reversed from their source document.'));
        }

        try {
            $this->journalService->reverseManualJournal($journalEntry);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('Journal entry reversed. Account balances rolled back.'));
    }

    public function destroy(JournalEntry $journalEntry)
    {
        if (!Auth::user()->can('delete-journal-entries') || $journalEntry->created_by != creatorId()) {
            return back()->with('error', __('Permission denied'));
        }

        if ($journalEntry->entry_type !== 'manual') {
            return back()->with('error', __('Automatic journal entries cannot be deleted.'));
        }

        if (!$journalEntry->isDraft()) {
            return back()->with('error', __('Only draft journal entries can be deleted. Reverse this entry instead.'));
        }

        $journalEntry->items()->delete();
        $journalEntry->delete();

        return redirect()->route('account.journal-entries.index')
            ->with('success', __('Journal entry deleted.'));
    }

    /** Accounts available for selection, grouped by type for the picker. */
    private function accountOptions()
    {
        return ChartOfAccount::with('accountType:id,name')
            ->where('created_by', creatorId())
            ->where('is_active', true)
            ->orderBy('account_code')
            ->get(['id', 'account_code', 'account_name', 'normal_balance', 'account_type_id']);
    }

    private function validateEntry(Request $request): array
    {
        return $request->validate([
            'journal_date'           => ['required', 'date'],
            'description'            => ['required', 'string', 'max:500'],
            'lines'                  => ['required', 'array', 'min:2'],
            'lines.*.account_id'     => ['required', 'exists:chart_of_accounts,id'],
            'lines.*.description'    => ['nullable', 'string', 'max:255'],
            'lines.*.debit_amount'   => ['nullable', 'numeric', 'min:0'],
            'lines.*.credit_amount'  => ['nullable', 'numeric', 'min:0'],
        ], [
            'lines.min' => __('A journal entry needs at least two lines — one debit and one credit.'),
        ]);
    }
}
