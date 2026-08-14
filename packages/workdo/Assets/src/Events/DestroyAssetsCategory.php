<?php

namespace Workdo\Assets\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Workdo\Assets\Models\AssetsCategory;

class DestroyAssetsCategory
{
    use Dispatchable;

    public function __construct(
        public AssetsCategory $category
    ) {}
}
