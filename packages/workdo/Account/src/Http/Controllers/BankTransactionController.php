<?php

namespace Workdo\Account\Http\Controllers;

use Workdo\Account\Models\BankTransaction;
use Workdo\Account\Models\BankAccount;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BankTransactionController extends Controller
{
    public function index(Request $request)
    {
        if(Auth::user()->can('manage-bank-transactions')){
            $query = BankTransaction::with(['bankAccount'])
                ->where('created_by', creatorId());
            // Apply filters
            if ($request->bank_account_id) {
                $query->where('bank_account_id', $request->bank_account_id);
            }
            if ($request->transaction_type) {
                $query->where('transaction_type', $request->transaction_type);
            }
            if ($request->search) {
                $query->where('reference_number', 'like', '%' . $request->search . '%')
                     ->orWhere('description', 'like', '%' . $request->search . '%');
            }

            $sortField = $request->get('sort', 'created_at');
            $sortDirection = $request->get('direction', 'desc');
            if ($sortField) {
                $query->orderBy($sortField, $sortDirection);
            }

            $transactions = $query->paginate($request->get('per_page', 10));
            $bankAccounts = BankAccount::where('is_active', true)->where('created_by', creatorId())->get();

            return Inertia::render('Account/BankTransactions/Index', [
                'transactions' => $transactions,
                'bankAccounts' => $bankAccounts,
                'filters' => $request->only(['bank_account_id', 'transaction_type', 'search'])
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function markReconciled($id)
    {
        if(Auth::user()->can('reconcile-bank-transactions')){
            $transaction = BankTransaction::where('id', $id)
                ->where('created_by', creatorId())
                ->first();

            if($transaction && $transaction->reconciliation_status === 'unreconciled') {
                $transaction->reconciliation_status = 'reconciled';
                $transaction->save();

                return back()->with('success', __('Transaction marked as reconciled'));
            }

            return back()->with('error', __('Transaction not found or already reconciled'));
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }
}
