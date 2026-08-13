<?php

namespace Workdo\Lead\Events;

use Workdo\Lead\Models\Deal;
use Workdo\Lead\Models\DealStage;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Http\Request;

class DealMoved
{
    use Dispatchable;

    public function __construct(
        public Request $request,
        public Deal $deal,
        public DealStage $oldStage
    ) {}
}