<?php

namespace Workdo\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Assets\Events\CreateAssetMaintenance;
use Workdo\Assets\Events\DestroyAssetMaintenance;
use Workdo\Assets\Events\UpdateAssetMaintenance;
use Workdo\Assets\Models\AssetMaintenance;
use Workdo\Assets\Models\Asset;
use Workdo\Assets\Http\Requests\StoreAssetMaintenanceRequest;
use Workdo\Assets\Http\Requests\UpdateAssetMaintenanceRequest;

class AssetMaintenanceController extends Controller
{
    public function index()
    {
        if(Auth::user()->can('manage-asset-maintenance')){
            $maintenances = AssetMaintenance::query()
                ->with(['asset'])
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-asset-maintenance')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-asset-maintenance')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(request('title'), fn($q) => $q->where('title', 'like', '%' . request('title') . '%'))
                ->when(request('maintenance_type') && request('maintenance_type') !== 'all', fn($q) => $q->where('maintenance_type', request('maintenance_type')))
                ->when(request('status') && request('status') !== 'all', fn($q) => $q->where('status', request('status')))
                ->when(request('priority') && request('priority') !== 'all', fn($q) => $q->where('priority', request('priority')))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            $assets = Asset::where('created_by', creatorId())
                ->select('id', 'name')
                ->get();

            return Inertia::render('Assets/AssetMaintenance/Index', [
                'maintenances' => $maintenances,
                'assets' => $assets,
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreAssetMaintenanceRequest $request)
    {
        if(Auth::user()->can('create-asset-maintenance')){
            $validated = $request->validated();

            $maintenance = new AssetMaintenance();
            $maintenance->asset_id = $validated['asset_id'];
            $maintenance->maintenance_type = $validated['maintenance_type'];
            $maintenance->title = $validated['title'];
            $maintenance->description = $validated['description'];
            $maintenance->scheduled_date = $validated['scheduled_date'];
            $maintenance->completed_date = $validated['completed_date'];
            $maintenance->cost = $validated['cost'];
            $maintenance->technician_name = $validated['technician_name'];
            $maintenance->status = $validated['status'];
            $maintenance->priority = $validated['priority'];
            $maintenance->notes = $validated['notes'];
            $maintenance->next_maintenance_date = $validated['next_maintenance_date'];
            $maintenance->creator_id = Auth::id();
            $maintenance->created_by = creatorId();
            $maintenance->save();

            CreateAssetMaintenance::dispatch($request, $maintenance);

            return redirect()->route('assets.asset-maintenance.index')->with('success', __('The maintenance record has been created successfully.'));
        }
        else{
            return redirect()->route('assets.asset-maintenance.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateAssetMaintenanceRequest $request, AssetMaintenance $assetMaintenance)
    {
        if(Auth::user()->can('edit-asset-maintenance')){
            $validated = $request->validated();

            $assetMaintenance->asset_id = $validated['asset_id'];
            $assetMaintenance->maintenance_type = $validated['maintenance_type'];
            $assetMaintenance->title = $validated['title'];
            $assetMaintenance->description = $validated['description'];
            $assetMaintenance->scheduled_date = $validated['scheduled_date'];
            $assetMaintenance->completed_date = $validated['completed_date'];
            $assetMaintenance->cost = $validated['cost'];
            $assetMaintenance->technician_name = $validated['technician_name'];
            $assetMaintenance->status = $validated['status'];
            $assetMaintenance->priority = $validated['priority'];
            $assetMaintenance->notes = $validated['notes'];
            $assetMaintenance->next_maintenance_date = $validated['next_maintenance_date'];
            $assetMaintenance->save();

            UpdateAssetMaintenance::dispatch($request, $assetMaintenance);

            return back()->with('success', __('The maintenance record details are updated successfully.'));
        }
        else{
            return redirect()->route('assets.asset-maintenance.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(AssetMaintenance $assetMaintenance)
    {
        if(Auth::user()->can('delete-asset-maintenance')){
            DestroyAssetMaintenance::dispatch($assetMaintenance);

            $assetMaintenance->delete();
            return back()->with('success', __('The maintenance record has been deleted.'));
        }
        else{
            return redirect()->route('assets.asset-maintenance.index')->with('error', __('Permission denied'));
        }
    }
}
