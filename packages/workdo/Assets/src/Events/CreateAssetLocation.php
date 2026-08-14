<?php

namespace Workdo\Assets\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Http\Request;
use Workdo\Assets\Models\AssetLocation;

class CreateAssetLocation
{
    use Dispatchable;

    public function __construct(
        public Request $request,
        public AssetLocation $assetLocation
    ) {}
}