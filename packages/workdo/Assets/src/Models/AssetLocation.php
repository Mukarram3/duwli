<?php

namespace Workdo\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AssetLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type',
        'parent_id',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'contact_person',
        'contact_phone',
        'contact_email',
        'description',
        'is_active',
        'creator_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function assets()
    {
        return $this->hasMany(Asset::class, 'location_id');
    }

    public function parent()
    {
        return $this->belongsTo(AssetLocation::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(AssetLocation::class, 'parent_id');
    }
}