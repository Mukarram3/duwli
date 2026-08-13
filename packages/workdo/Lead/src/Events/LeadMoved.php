<?php

namespace Workdo\Lead\Events;

use Workdo\Lead\Models\Lead;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Http\Request;
use Workdo\Lead\Models\LeadStage;

class LeadMoved
{
    use Dispatchable;

    public function __construct(
        public Request $request,
        public Lead $lead,
        public LeadStage $oldStage
    ) {}
}