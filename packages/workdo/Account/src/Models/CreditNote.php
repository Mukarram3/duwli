<?php

namespace Workdo\Account\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Models\SalesInvoice;
use App\Models\SalesInvoiceReturn;

class CreditNote extends Model
{
    protected $fillable = [
        'credit_note_number',
        'credit_note_date',
        'customer_id',
        'invoice_id',
        'return_id',
        'reason',
        'status',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'applied_amount',
        'balance_amount',
        'notes',
        'approved_by',
        'creator_id',
        'created_by'
    ];

    protected $casts = [
        'credit_note_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'applied_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2'
    ];

    public function items(): HasMany
    {
        return $this->hasMany(CreditNoteItem::class, 'credit_note_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class, 'invoice_id');
    }

    public function salesReturn(): BelongsTo
    {
        return $this->belongsTo(SalesInvoiceReturn::class, 'return_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(CreditNoteApplication::class, 'credit_note_id');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($creditNote) {
            if (empty($creditNote->credit_note_number)) {
                $creditNote->credit_note_number = static::generateCreditNoteNumber();
            }
            if (empty($creditNote->credit_note_date)) {
                $creditNote->credit_note_date = now();
            }
        });
    }

    public static function generateCreditNoteNumber(): string
    {
        $year = date('Y');
        $month = date('m');
        $lastNote = static::where('credit_note_number', 'like', "CN-{$year}-{$month}-%")
            ->where('created_by', creatorId())
            ->orderBy('credit_note_number', 'desc')
            ->first();

        if ($lastNote) {
            $lastNumber = (int) substr($lastNote->credit_note_number, -3);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return "CN-{$year}-{$month}-" . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }
}