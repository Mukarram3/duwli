<?php

namespace Workdo\Assets\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Http\Request;
use Illuminate\Queue\SerializesModels;
use Workdo\Assets\Models\AssetsCategory;

class CreateAssetsCategory
{
    use Dispatchable;

    public function __construct(
        public Request $request,
        public AssetsCategory $category
    ) {}
}
