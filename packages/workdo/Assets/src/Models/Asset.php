<?php

namespace Workdo\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'purchase_date',
        'supported_date',
        'serial_code',
        'quantity',
        'unit_price',
        'purchase_cost',
        'warranty_period',
        'location',
        'location_id',
        'description',
        'image',
        'category_id',
        'creator_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'supported_date' => 'date',
            'unit_price' => 'decimal:2',
            'purchase_cost' => 'decimal:2',
            'image' => 'string'
        ];
    }



    public function category()
    {
        return $this->belongsTo(AssetsCategory::class);
    }

    public function assignments()
    {
        return $this->hasMany(AssetAssignment::class);
    }

    public function activeAssignment()
    {
        return $this->hasOne(AssetAssignment::class)->where('status', 'active');
    }

    public function location()
    {
        return $this->belongsTo(AssetLocation::class, 'location_id');
    }
}
