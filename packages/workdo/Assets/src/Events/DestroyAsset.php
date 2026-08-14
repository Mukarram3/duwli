<?php

namespace Workdo\Assets\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Workdo\Assets\Models\Asset;

class DestroyAsset
{
     use Dispatchable;

    public function __construct(
        public Asset $asset
    ) {}
}
