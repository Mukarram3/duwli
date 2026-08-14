<?php

namespace Workdo\Assets\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Http\Request;
use Illuminate\Queue\SerializesModels;
use Workdo\Assets\Models\Asset;

class UpdateAsset
{
    use Dispatchable;

    public function __construct(
        public Request $request,
        public Asset $asset
    ) {}
}
