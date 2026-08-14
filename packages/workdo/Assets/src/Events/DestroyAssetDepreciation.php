<?php

namespace Workdo\Assets\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Workdo\Assets\Models\AssetDepreciation;

class DestroyAssetDepreciation
{
    use Dispatchable;

    public function __construct(
        public AssetDepreciation $assetDepreciation
    ) {}
}
