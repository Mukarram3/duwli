<?php

namespace Workdo\Assets\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Workdo\Assets\Models\AssetAssignment;

class DestroyAssetAssignment
{
    use Dispatchable;

    public function __construct(
        public AssetAssignment $assetAssignment
    ) {}
}