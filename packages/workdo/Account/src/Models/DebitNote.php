<?php

namespace Workdo\Account\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseReturn;

class DebitNote extends Model
{
    protected $fillable = [
        'debit_note_number',
        'debit_note_date',
        'vendor_id',
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
        'debit_note_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'applied_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2'
    ];

    public function items(): HasMany
    {
        return $this->hasMany(DebitNoteItem::class, 'debit_note_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(PurchaseInvoice::class, 'invoice_id');
    }

    public function purchaseReturn(): BelongsTo
    {
        return $this->belongsTo(PurchaseReturn::class, 'return_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(DebitNoteApplication::class, 'debit_note_id');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($debitNote) {
            if (empty($debitNote->debit_note_number)) {
                $debitNote->debit_note_number = static::generateDebitNoteNumber();
            }
            if (empty($debitNote->debit_note_date)) {
                $debitNote->debit_note_date = now();
            }
        });
    }

    public static function generateDebitNoteNumber(): string
    {
        $year = date('Y');
        $month = date('m');
        $lastNote = static::where('debit_note_number', 'like', "DN-{$year}-{$month}-%")
            ->where('created_by', creatorId())
            ->orderBy('debit_note_number', 'desc')
            ->first();

        if ($lastNote) {
            $lastNumber = (int) substr($lastNote->debit_note_number, -3);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return "DN-{$year}-{$month}-" . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }
}