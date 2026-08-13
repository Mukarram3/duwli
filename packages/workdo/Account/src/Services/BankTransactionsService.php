<?php

namespace Workdo\Account\Services;

use Workdo\Account\Models\BankTransaction;
use Illuminate\Support\Facades\Auth;
use Workdo\Account\Models\BankAccount;

class BankTransactionsService
{
    public function createVendorPayment($vendorPayment)
    {
        // Get current running balance for the bank account
        $lastTransaction = BankTransaction::where('bank_account_id', $vendorPayment->bank_account_id)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance - $vendorPayment->payment_amount : -$vendorPayment->payment_amount;

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $vendorPayment->bank_account_id;
        $bankTransaction->transaction_date = $vendorPayment->payment_date;
        $bankTransaction->transaction_type = 'debit';
        $bankTransaction->reference_number = $vendorPayment->payment_number;
        $bankTransaction->description = 'Vendor Payment #' . $vendorPayment->payment_number . ' - ' . $vendorPayment->vendor->name;
        $bankTransaction->amount = $vendorPayment->payment_amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

         // Update bank account balance
        $this->updateBankBalance($vendorPayment->bank_account_id, -$vendorPayment->payment_amount);
    }

    public function createCustomerPayment($customerPayment)
    {
        // Get current running balance for the bank account
        $lastTransaction = BankTransaction::where('bank_account_id', $customerPayment->bank_account_id)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance + $customerPayment->payment_amount : $customerPayment->payment_amount;

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $customerPayment->bank_account_id;
        $bankTransaction->transaction_date = $customerPayment->payment_date;
        $bankTransaction->transaction_type = 'credit';
        $bankTransaction->reference_number = $customerPayment->payment_number;
        $bankTransaction->description = 'Customer Payment #' . $customerPayment->payment_number . ' - ' . $customerPayment->customer->name;
        $bankTransaction->amount = $customerPayment->payment_amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        // Update bank account balance
        $this->updateBankBalance($customerPayment->bank_account_id, $customerPayment->payment_amount);
    }

    public function createTransferBankTransactions($transfer)
    {
        // Get running balance for source account
        $fromLastTransaction = BankTransaction::where('bank_account_id', $transfer->from_account_id)->orderBy('id', 'desc')->first();
        $fromRunningBalance = $fromLastTransaction ? $fromLastTransaction->running_balance - $transfer->transfer_amount : -$transfer->transfer_amount;

        // Debit transaction from source account
        $debitTransaction = new BankTransaction();
        $debitTransaction->bank_account_id = $transfer->from_account_id;
        $debitTransaction->transaction_date = $transfer->transfer_date;
        $debitTransaction->transaction_type = 'debit';
        $debitTransaction->reference_number = $transfer->transfer_number;
        $debitTransaction->description = 'Transfer to ' . $transfer->toAccount->account_name;
        $debitTransaction->amount = $transfer->transfer_amount;
        $debitTransaction->running_balance = $fromRunningBalance;
        $debitTransaction->transaction_status = 'cleared';
        $debitTransaction->reconciliation_status = 'unreconciled';
        $debitTransaction->created_by = creatorId();
        $debitTransaction->save();

        // Get running balance for destination account
        $toLastTransaction = BankTransaction::where('bank_account_id', $transfer->to_account_id)->orderBy('id', 'desc')->first();
        $toRunningBalance = $toLastTransaction ? $toLastTransaction->running_balance + $transfer->transfer_amount : $transfer->transfer_amount;

        // Credit transaction to destination account
        $creditTransaction = new BankTransaction();
        $creditTransaction->bank_account_id = $transfer->to_account_id;
        $creditTransaction->transaction_date = $transfer->transfer_date;
        $creditTransaction->transaction_type = 'credit';
        $creditTransaction->reference_number = $transfer->transfer_number;
        $creditTransaction->description = 'Transfer from ' . $transfer->fromAccount->account_name;
        $creditTransaction->amount = $transfer->transfer_amount;
        $creditTransaction->running_balance = $toRunningBalance;
        $creditTransaction->transaction_status = 'cleared';
        $creditTransaction->reconciliation_status = 'unreconciled';
        $creditTransaction->created_by = creatorId();
        $creditTransaction->save();

        // Additional debit for transfer charges (if any)
        if ($transfer->transfer_charges > 0) {
            $chargesRunningBalance = $fromRunningBalance - $transfer->transfer_charges;

            $chargesTransaction = new BankTransaction();
            $chargesTransaction->bank_account_id = $transfer->from_account_id;
            $chargesTransaction->transaction_date = $transfer->transfer_date;
            $chargesTransaction->transaction_type = 'debit';
            $chargesTransaction->reference_number = $transfer->transfer_number . '-CHARGES';
            $chargesTransaction->description = 'Transfer charges for ' . $transfer->transfer_number;
            $chargesTransaction->amount = $transfer->transfer_charges;
            $chargesTransaction->running_balance = $chargesRunningBalance;
            $chargesTransaction->transaction_status = 'cleared';
            $chargesTransaction->reconciliation_status = 'unreconciled';
            $chargesTransaction->created_by = creatorId();
            $chargesTransaction->save();
        }
    }

    public function updateBankBalance($bankAccountId, $amount) {
        $bankAccount = BankAccount::find($bankAccountId);
        $bankAccount->current_balance += $amount;
        $bankAccount->save();

        // Update running balance for latest transaction
        $latestTransaction = BankTransaction::where('bank_account_id', $bankAccountId)
                            ->latest()
                            ->first();

        if ($latestTransaction) {
            $latestTransaction->running_balance = $bankAccount->current_balance;
            $latestTransaction->save();
        }
    }
    public function createRetainerPayment($retainerPayment)
    {
        // Get current running balance for the bank account
        $lastTransaction = BankTransaction::where('bank_account_id', $retainerPayment->bank_account_id)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance + $retainerPayment->payment_amount : $retainerPayment->payment_amount;

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $retainerPayment->bank_account_id;
        $bankTransaction->transaction_date = $retainerPayment->payment_date;
        $bankTransaction->transaction_type = 'credit';
        $bankTransaction->reference_number = $retainerPayment->payment_number;
        $bankTransaction->description = 'Retainer Payment #' . $retainerPayment->payment_number . ' - ' . $retainerPayment->customer->name;
        $bankTransaction->amount = $retainerPayment->payment_amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        // Update bank account balance
        $this->updateBankBalance($retainerPayment->bank_account_id, $retainerPayment->payment_amount);
    }

    public function createRevenuePayment($revenue)
    {
        // Get current running balance for the bank account
        $lastTransaction = BankTransaction::where('bank_account_id', $revenue->bank_account_id)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance + $revenue->amount : $revenue->amount;

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $revenue->bank_account_id;
        $bankTransaction->transaction_date = $revenue->revenue_date;
        $bankTransaction->transaction_type = 'credit';
        $bankTransaction->reference_number = $revenue->revenue_number;
        $bankTransaction->description = 'Revenue Posted: ' . ($revenue->description ?? 'Revenue transaction');
        $bankTransaction->amount = $revenue->amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        // Update bank account balance
        $this->updateBankBalance($revenue->bank_account_id, $revenue->amount);
    }

    public function createExpensePayment($expense)
    {
        // Get current running balance for the bank account
        $lastTransaction = BankTransaction::where('bank_account_id', $expense->bank_account_id)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance - $expense->amount : -$expense->amount;

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $expense->bank_account_id;
        $bankTransaction->transaction_date = $expense->expense_date;
        $bankTransaction->transaction_type = 'debit';
        $bankTransaction->reference_number = $expense->expense_number;
        $bankTransaction->description = 'Expense Posted: ' . ($expense->description ?? 'Expense transaction');
        $bankTransaction->amount = $expense->amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        // Update bank account balance (negative amount to decrease balance)
        $this->updateBankBalance($expense->bank_account_id, -$expense->amount);
    }
    public function createCommissionPayment($commissionPayment)
    {
        // Get current running balance for the bank account
        $lastTransaction = BankTransaction::where('bank_account_id', $commissionPayment->bank_account_id)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance - $commissionPayment->payment_amount : -$commissionPayment->payment_amount;

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $commissionPayment->bank_account_id;
        $bankTransaction->transaction_date = $commissionPayment->payment_date;
        $bankTransaction->transaction_type = 'debit';
        $bankTransaction->reference_number = $commissionPayment->payment_number;
        $bankTransaction->description = 'Commission Payment #' . $commissionPayment->payment_number . ' - ' . $commissionPayment->agent->name;
        $bankTransaction->amount = $commissionPayment->payment_amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        // Update bank account balance (negative amount to decrease balance)
        $this->updateBankBalance($commissionPayment->bank_account_id, -$commissionPayment->payment_amount);
    }

    public function createPayrollPayment($payrollEntry)
    {
        $bankAccountId = $payrollEntry->payroll->bank_account_id;
        $lastTransaction = BankTransaction::where('bank_account_id', $bankAccountId)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance - $payrollEntry->net_pay : -$payrollEntry->net_pay;

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $bankAccountId;
        $bankTransaction->transaction_date = now();
        $bankTransaction->transaction_type = 'debit';
        $bankTransaction->reference_number = 'PAYROLL-' . $payrollEntry->id;
        $bankTransaction->description = 'Salary Payment - ' . $payrollEntry->employee->user->name;
        $bankTransaction->amount = $payrollEntry->net_pay;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        $this->updateBankBalance($bankAccountId, -$payrollEntry->net_pay);
    }

    public function createPosPayment($posSale, $bankAccountId)
    {
        $posSale->load('payment');
        $amount = $posSale->payment->discount_amount ?? 0;

        $lastTransaction = BankTransaction::where('bank_account_id', $bankAccountId)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance + $amount : $amount;

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $bankAccountId;
        $bankTransaction->transaction_date = $posSale->pos_date ?? now();
        $bankTransaction->transaction_type = 'credit';
        $bankTransaction->reference_number = $posSale->sale_number;
        $bankTransaction->description = 'POS Sale ' . $posSale->sale_number;
        $bankTransaction->amount = $amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        $this->updateBankBalance($bankAccountId, $amount);
    }

    public function createMobileServicePayment($payment)
    {
        // Get current running balance for the bank account
        $lastTransaction = BankTransaction::where('bank_account_id', $payment->bank_account_id)
            ->orderBy('id', 'desc')
            ->first();
         $runningBalance = $lastTransaction ? $lastTransaction->running_balance + $payment->payment_amount : $payment->payment_amount;

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $payment->bank_account_id;
        $bankTransaction->transaction_date = $payment->payment_date;
        $bankTransaction->transaction_type = 'credit';
        $bankTransaction->reference_number = $payment->payment_number;
        $bankTransaction->description = 'Mobile Service Payment: ' . ($payment->description ?? 'Mobile service transaction');
        $bankTransaction->amount = $payment->payment_amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        // Update bank account balance
        $this->updateBankBalance($payment->bank_account_id, $payment->payment_amount);
    }

    public function createMarkFleetBookingPayment($payment)
    {
        // Get current running balance for the bank account
        $lastTransaction = BankTransaction::where('bank_account_id', $payment->bank_account_id)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance + $payment->payment_amount : $payment->payment_amount;

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $payment->bank_account_id;
        $bankTransaction->transaction_date = $payment->payment_date;
        $bankTransaction->transaction_type = 'credit';
        $bankTransaction->reference_number = $payment->payment_number;
        $bankTransaction->description = 'Fleet Booking Payment: ' . ($payment->description ?? 'Fleet booking transaction');
        $bankTransaction->amount = $payment->payment_amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        // Update bank account balance
        $this->updateBankBalance($payment->bank_account_id, $payment->payment_amount);
    }

    public function createBeautyBookingPayment($booking)
    {
        // Find bank account by payment gateway
        $bankAccount = BankAccount::where('payment_gateway', $booking->payment_option)->where('created_by', $booking->created_by)
            ->first();
        if (!$bankAccount) {
            throw new \Exception('Bank account not found for payment gateway: ' . $booking->payment_option);
        }

        // Get current running balance for the bank account
        $lastTransaction = BankTransaction::where('bank_account_id', $bankAccount->id)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance + $booking->price : $booking->price;
        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $bankAccount->id;
        $bankTransaction->transaction_date = $booking->date ?? now();
        $bankTransaction->transaction_type = 'credit';
        $bankTransaction->reference_number = $booking->payment_number ?? 'BEAUTY-' . $booking->id;
        $bankTransaction->description = 'Beauty Booking Payment via ' . $booking->payment_option;
        $bankTransaction->amount = $booking->price;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = $booking->created_by;
        $bankTransaction->save();

        // Update bank account balance
        $this->updateBankBalance($bankAccount->id, $booking->price);
    }

    public function createDairyCattlePayment($dairyCattlePayment)
    {
        // Get current running balance for the bank account
        $lastTransaction = BankTransaction::where('bank_account_id', $dairyCattlePayment->bank_account_id)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance + $dairyCattlePayment->payment_amount : $dairyCattlePayment->payment_amount;

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $dairyCattlePayment->bank_account_id;
        $bankTransaction->transaction_date = $dairyCattlePayment->payment_date;
        $bankTransaction->transaction_type = 'credit';
        $bankTransaction->reference_number = $dairyCattlePayment->payment_number;
        $bankTransaction->description = 'Dairy Cattle Payment: ' . ($dairyCattlePayment->description ?? 'Dairy cattle transaction');
        $bankTransaction->amount = $dairyCattlePayment->payment_amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        // Update bank account balance
        $this->updateBankBalance($dairyCattlePayment->bank_account_id, $dairyCattlePayment->payment_amount);
    }

    public function createCateringOrderPayment($payment)
    {
        // Get current running balance for the bank account
        $lastTransaction = BankTransaction::where('bank_account_id', $payment->bank_account_id)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance + $payment->amount : $payment->amount;

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $payment->bank_account_id;
        $bankTransaction->transaction_date = $payment->payment_date;
        $bankTransaction->transaction_type = 'credit';
        $bankTransaction->reference_number = $payment->reference_number;
        $bankTransaction->description = 'Catering Order Payment #' . $payment->id;
        $bankTransaction->amount = $payment->amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        // Update bank account balance
        $this->updateBankBalance($payment->bank_account_id, $payment->amount);
    }

    public function createUpdateSalesAgentCommissionPayment($payment)
    {
        $lastTransaction = BankTransaction::where('bank_account_id', $payment->bank_account_id)
            ->orderBy('id', 'desc')
            ->first();
        $runningBalance = $lastTransaction ? $lastTransaction->running_balance - $payment->payment_amount : -$payment->payment_amount;

        $agentName = $payment->agent && $payment->agent->user ? $payment->agent->user->name : 'Agent';

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $payment->bank_account_id;
        $bankTransaction->transaction_date = $payment->payment_date;
        $bankTransaction->transaction_type = 'debit';
        $bankTransaction->reference_number = $payment->payment_number;
        $bankTransaction->description = 'Commission Payment #' . $payment->payment_number . ' - ' . $agentName;
        $bankTransaction->amount = $payment->payment_amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        $this->updateBankBalance($payment->bank_account_id, -$payment->payment_amount);
    }

    public function createCommissionAdjustmentBankTransaction($adjustment)
    {
        // Only create bank transaction if adjustment has bank_account_id
        if (!isset($adjustment->bank_account_id) || !$adjustment->bank_account_id) {
            return;
        }
        $lastTransaction = BankTransaction::where('bank_account_id', $adjustment->bank_account_id)
            ->orderBy('id', 'desc')
            ->first();
        $agentName = $adjustment->agent && $adjustment->agent->user ? $adjustment->agent->user->name : 'Agent';
        $amount = abs($adjustment->adjustment_amount);

        // Bonus/Correction(+) = Debit (cash out to agent)
        // Penalty/Correction(-) = Credit (cash in from agent)
        if ($adjustment->adjustment_type === 'bonus' || ($adjustment->adjustment_type === 'correction' && $adjustment->adjustment_amount > 0)) {
            $transactionType = 'debit';
            $runningBalance = $lastTransaction ? $lastTransaction->running_balance - $amount : -$amount;
            $balanceChange = -$amount;
        } else {
            $transactionType = 'credit';
            $runningBalance = $lastTransaction ? $lastTransaction->running_balance + $amount : $amount;
            $balanceChange = $amount;
        }

        $bankTransaction = new BankTransaction();
        $bankTransaction->bank_account_id = $adjustment->bank_account_id;
        $bankTransaction->transaction_date = $adjustment->adjustment_date;
        $bankTransaction->transaction_type = $transactionType;
        $bankTransaction->reference_number = 'ADJ-' . $adjustment->id;
        $bankTransaction->description = 'Commission Adjustment (' . ucfirst($adjustment->adjustment_type) . ') - ' . $agentName;
        $bankTransaction->amount = $amount;
        $bankTransaction->running_balance = $runningBalance;
        $bankTransaction->transaction_status = 'cleared';
        $bankTransaction->reconciliation_status = 'unreconciled';
        $bankTransaction->created_by = creatorId();
        $bankTransaction->save();

        $this->updateBankBalance($adjustment->bank_account_id, $balanceChange);
    }
}
