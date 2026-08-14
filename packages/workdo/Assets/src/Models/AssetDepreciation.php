<?php

namespace Workdo\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class AssetDepreciation extends Model
{
    protected $fillable = [
        'asset_id',
        'depreciation_method',
        'useful_life_years',
        'salvage_value',
        'annual_depreciation',
        'accumulated_depreciation',
        'book_value',
        'depreciation_start_date',
        'last_calculated_date',
        'is_fully_depreciated',
        'notes',
        'creator_id',
        'updater_id',
        'created_by',
    ];

    protected $casts = [
        'salvage_value' => 'decimal:2',
        'annual_depreciation' => 'decimal:2',
        'accumulated_depreciation' => 'decimal:2',
        'book_value' => 'decimal:2',
        'depreciation_start_date' => 'date',
        'last_calculated_date' => 'date',
        'is_fully_depreciated' => 'boolean',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updater_id');
    }
}
