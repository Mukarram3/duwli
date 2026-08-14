<?php

namespace Workdo\Assets\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Workdo\Assets\Models\AssetLocation;

class DestroyAssetLocation
{
    use Dispatchable;

    public function __construct(
        public AssetLocation $assetLocation
    ) {}
}