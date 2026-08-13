<?php

use Workdo\Account\Http\Controllers\RevenueCategoriesController;
use Workdo\Account\Http\Controllers\ExpenseCategoriesController;

use Workdo\Account\Http\Controllers\ChartOfAccountController;

use Workdo\Account\Http\Controllers\BankAccountController;

use Illuminate\Support\Facades\Route;
use Workdo\Account\Http\Controllers\AccountTypeController;
use Workdo\Account\Http\Controllers\DashboardController;
use Workdo\Account\Http\Controllers\SystemSetupController;
use Workdo\Account\Http\Controllers\VendorController;
use Workdo\Account\Http\Controllers\CustomerController;
use Workdo\Account\Http\Controllers\VendorPaymentController;
use Workdo\Account\Http\Controllers\BankTransactionController;
use Workdo\Account\Http\Controllers\BankTransferController;
use Workdo\Account\Http\Controllers\DebitNoteController;
use Workdo\Account\Http\Controllers\CreditNoteController;
use Workdo\Account\Http\Controllers\CustomerPaymentController;
use Workdo\Account\Http\Controllers\RevenueController;
use Workdo\Account\Http\Controllers\ExpenseController;
use Workdo\Account\Http\Controllers\ReportsController;
use Workdo\Account\Models\AccountType;

Route::middleware(['web', 'auth', 'verified', 'PlanModuleCheck:Account'])->group(function () {
    Route::get('/dashboard/account', [DashboardController::class, 'index'])->name('account.index');
    Route::resource('account/vendors', VendorController::class, ['as' => 'account']);
    Route::resource('account/customers', CustomerController::class, ['as' => 'account']);

    Route::prefix('account/bank-accounts')->name('account.bank-accounts.')->group(function () {
        Route::get('/', [BankAccountController::class, 'index'])->name('index');
        Route::post('/', [BankAccountController::class, 'store'])->name('store');
        Route::get('/{bankaccount}/edit', [BankAccountController::class, 'edit'])->name('edit');
        Route::put('/{bankaccount}', [BankAccountController::class, 'update'])->name('update');
        Route::delete('/{bankaccount}', [BankAccountController::class, 'destroy'])->name('destroy');
        Route::get('/api/list', [BankAccountController::class, 'bankAccounts'])->name('api.list');
    });

    Route::prefix('account/account-types')->name('account.account-types.')->group(function () {
        Route::get('/', [AccountTypeController::class, 'index'])->name('index');
        Route::post('/', [AccountTypeController::class, 'store'])->name('store');
        Route::put('/{accounttype}', [AccountTypeController::class, 'update'])->name('update');
        Route::delete('/{accounttype}', [AccountTypeController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('account/chart-of-accounts')->name('account.chart-of-accounts.')->group(function () {
        Route::get('/', [ChartOfAccountController::class, 'index'])->name('index');
        Route::post('/', [ChartOfAccountController::class, 'store'])->name('store');
        Route::get('/{chartofaccount}', [ChartOfAccountController::class, 'show'])->name('show');
        Route::get('/{chartofaccount}/edit', [ChartOfAccountController::class, 'edit'])->name('edit');
        Route::put('/{chartofaccount}', [ChartOfAccountController::class, 'update'])->name('update');
        Route::delete('/{chartofaccount}', [ChartOfAccountController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('account/vendor-payments')->name('account.vendor-payments.')->group(function () {
        Route::get('/', [VendorPaymentController::class, 'index'])->name('index');
        Route::post('/store', [VendorPaymentController::class, 'store'])->name('store');
        Route::delete('/{vendorPayment}', [VendorPaymentController::class, 'destroy'])->name('destroy');
        Route::get('/vendors/{vendorId}/outstanding', [VendorPaymentController::class, 'getOutstandingInvoices'])->name('vendors.outstanding');
        Route::post('/{vendorPayment}/update-status', [VendorPaymentController::class, 'updateStatus'])->name('update-status');
    });

    Route::prefix('account/bank-transactions')->name('account.bank-transactions.')->group(function () {
        Route::get('/', [BankTransactionController::class, 'index'])->name('index');
        Route::post('/{id}/mark-reconciled', [BankTransactionController::class, 'markReconciled'])->name('mark-reconciled');
    });

    Route::prefix('account/bank-transfers')->name('account.bank-transfers.')->group(function () {
        Route::get('/', [BankTransferController::class, 'index'])->name('index');
        Route::post('/', [BankTransferController::class, 'store'])->name('store');
        Route::put('/{banktransfer}', [BankTransferController::class, 'update'])->name('update');
        Route::delete('/{banktransfer}', [BankTransferController::class, 'destroy'])->name('destroy');
        Route::post('/{banktransfer}/process', [BankTransferController::class, 'process'])->name('process');
    });

    Route::prefix('account/debit-notes')->name('account.debit-notes.')->group(function () {
        Route::get('/', [DebitNoteController::class, 'index'])->name('index');
        Route::post('/{debitNote}/approve', [DebitNoteController::class, 'approve'])->name('approve');
        Route::delete('/{debitNote}', [DebitNoteController::class, 'destroy'])->name('destroy');
        Route::get('/{debitNote}', [DebitNoteController::class, 'show'])->name('show');
    });

    Route::prefix('account/credit-notes')->name('account.credit-notes.')->group(function () {
        Route::get('/', [CreditNoteController::class, 'index'])->name('index');
        Route::post('/{creditNote}/approve', [CreditNoteController::class, 'approve'])->name('approve');
        Route::delete('/{creditNote}', [CreditNoteController::class, 'destroy'])->name('destroy');
        Route::get('/{creditNote}', [CreditNoteController::class, 'show'])->name('show');
    });

    Route::prefix('account/customer-payments')->name('account.customer-payments.')->group(function () {
        Route::get('/', [CustomerPaymentController::class, 'index'])->name('index');
        Route::post('/', [CustomerPaymentController::class, 'store'])->name('store');
        Route::delete('/{customerPayment}', [CustomerPaymentController::class, 'destroy'])->name('destroy');
        Route::get('/customers/{customerId}/outstanding', [CustomerPaymentController::class, 'getOutstandingInvoices'])->name('outstanding-invoices');
        Route::patch('/{customerPayment}/update-status', [CustomerPaymentController::class, 'updateStatus'])->name('update-status');
    });

    Route::prefix('account/revenue-categories')->name('account.revenue-categories.')->group(function () {
        Route::get('/', [RevenueCategoriesController::class, 'index'])->name('index');
        Route::post('/', [RevenueCategoriesController::class, 'store'])->name('store');
        Route::get('/{revenuecategories}/edit', [RevenueCategoriesController::class, 'edit'])->name('edit');
        Route::put('/{revenuecategories}', [RevenueCategoriesController::class, 'update'])->name('update');
        Route::delete('/{revenuecategories}', [RevenueCategoriesController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('account/expense-categories')->name('account.expense-categories.')->group(function () {
        Route::get('/', [ExpenseCategoriesController::class, 'index'])->name('index');
        Route::post('/', [ExpenseCategoriesController::class, 'store'])->name('store');
        Route::get('/{expensecategories}/edit', [ExpenseCategoriesController::class, 'edit'])->name('edit');
        Route::put('/{expensecategories}', [ExpenseCategoriesController::class, 'update'])->name('update');
        Route::delete('/{expensecategories}', [ExpenseCategoriesController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('account/revenues')->name('account.revenues.')->group(function () {
        Route::get('/', [RevenueController::class, 'index'])->name('index');
        Route::post('/', [RevenueController::class, 'store'])->name('store');
        Route::get('/{revenue}', [RevenueController::class, 'show'])->name('show');
        Route::put('/{revenue}', [RevenueController::class, 'update'])->name('update');
        Route::delete('/{revenue}', [RevenueController::class, 'destroy'])->name('destroy');
        Route::post('/{revenue}/approve', [RevenueController::class, 'approve'])->name('approve');
        Route::post('/{revenue}/post', [RevenueController::class, 'post'])->name('post');
    });

    Route::prefix('account/expenses')->name('account.expenses.')->group(function () {
        Route::get('/', [ExpenseController::class, 'index'])->name('index');
        Route::post('/', [ExpenseController::class, 'store'])->name('store');
        Route::get('/{expense}', [ExpenseController::class, 'show'])->name('show');
        Route::put('/{expense}', [ExpenseController::class, 'update'])->name('update');
        Route::delete('/{expense}', [ExpenseController::class, 'destroy'])->name('destroy');
        Route::post('/{expense}/approve', [ExpenseController::class, 'approve'])->name('approve');
        Route::post('/{expense}/post', [ExpenseController::class, 'post'])->name('post');
    });

    Route::prefix('account/reports')->name('account.reports.')->group(function () {
        Route::get('/', [ReportsController::class, 'index'])->name('index');
        Route::get('/invoice-aging', [ReportsController::class, 'invoiceAging'])->name('invoice-aging');
        Route::get('/invoice-aging/print', [ReportsController::class, 'printInvoiceAging'])->name('invoice-aging.print');
        Route::get('/bill-aging', [ReportsController::class, 'billAging'])->name('bill-aging');
        Route::get('/bill-aging/print', [ReportsController::class, 'printBillAging'])->name('bill-aging.print');
        Route::get('/tax-summary', [ReportsController::class, 'taxSummary'])->name('tax-summary');
        Route::get('/tax-summary/print', [ReportsController::class, 'printTaxSummary'])->name('tax-summary.print');
        Route::get('/customer-balance', [ReportsController::class, 'customerBalance'])->name('customer-balance');
        Route::get('/customer-balance/print', [ReportsController::class, 'printCustomerBalance'])->name('customer-balance.print');
        Route::get('/vendor-balance', [ReportsController::class, 'vendorBalance'])->name('vendor-balance');
        Route::get('/vendor-balance/print', [ReportsController::class, 'printVendorBalance'])->name('vendor-balance.print');
    });

    Route::prefix('account')->name('account.reports.')->group(function () {
        Route::get('/customers/{customer}', [ReportsController::class, 'customerDetail'])->name('customer-detail');
        Route::get('/customers/{customer}/print', [ReportsController::class, 'printCustomerDetail'])->name('customer-detail.print');
        Route::get('/vendors/{vendor}', [ReportsController::class, 'vendorDetail'])->name('vendor-detail');
        Route::get('/vendors/{vendor}/print', [ReportsController::class, 'printVendorDetail'])->name('vendor-detail.print');
    });
});
