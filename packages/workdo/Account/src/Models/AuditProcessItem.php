<?php
// packages/workdo/Account/src/Models/AuditProcessItem.php

namespace Workdo\Account\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditProcessItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'auditable_type',
        'auditable_id',
        'reference',
        'amount',
        'status',
        'note',
        'reviewer_note',
        'added_by',
        'reviewed_by',
        'reviewed_at',
        'creator_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount'      => 'decimal:2',
            'reviewed_at' => 'datetime',
        ];
    }

    /** The document under review — a debit note, invoice, journal entry, etc. */
    public function auditable()
    {
        return $this->morphTo();
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** Short label for the document type, e.g. "Debit Note". */
    public function getDocumentTypeAttribute(): string
    {
        $class = class_basename($this->auditable_type);
        return trim(preg_replace('/(?<!^)[A-Z]/', ' $0', $class));
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
