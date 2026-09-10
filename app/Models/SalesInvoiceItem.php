<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesInvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'product_id',
        'quantity',
        'unit_price',
        'discount_percentage',
        'discount_amount',
        'tax_percentage',
        'tax_amount',
        'total_amount',

        /*
         * Added by the VAT migration. Harmless before it runs — an unmatched
         * fillable entry is only a problem if something tries to write it,
         * and the controller filters the payload against the live schema.
         */
        'description',
        'unit',
        'is_tax_inclusive',
        'total_before_vat',
        'tax_category_code',
        'exemption_reason_code',
    ];

    /*
     * NOTE: `creator_id` and `created_by` were listed here but DO NOT EXIST on
     * `sales_invoice_items` — the table has never had them. Writing them
     * produced "Unknown column 'creator_id' in 'INSERT INTO'".
     *
     * Ownership is carried by the parent invoice, which is the correct place
     * for it: a line cannot belong to anyone other than its invoice. They are
     * removed rather than added as columns for that reason.
     */

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_percentage' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2'
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class, 'invoice_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(\Workdo\ProductService\Models\ProductServiceItem::class, 'product_id');
    }

    public function taxes(): HasMany
    {
        return $this->hasMany(SalesInvoiceItemTax::class, 'item_id');
    }

    public function calculateAmounts()
    {
        $lineTotal = $this->quantity * $this->unit_price;
        $this->discount_amount = ($lineTotal * $this->discount_percentage) / 100;
        $afterDiscount = $lineTotal - $this->discount_amount;
        $this->tax_amount = ($afterDiscount * $this->tax_percentage) / 100;
        $this->total_amount = $afterDiscount + $this->tax_amount;
    }

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            $item->calculateAmounts();
        });
    }
}