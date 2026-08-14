<?php

namespace Workdo\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Assets\Events\CreateAssetDepreciation;
use Workdo\Assets\Events\DestroyAssetDepreciation;
use Workdo\Assets\Events\UpdateAssetDepreciation;
use Workdo\Assets\Models\AssetDepreciation;
use Workdo\Assets\Models\Asset;
use Workdo\Assets\Http\Requests\StoreAssetDepreciationRequest;
use Workdo\Assets\Http\Requests\UpdateAssetDepreciationRequest;

class AssetDepreciationController extends Controller
{
    public function index()
    {
        if(Auth::user()->can('manage-asset-depreciation')){
            $depreciations = AssetDepreciation::query()
                ->with(['asset'])
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-asset-depreciation')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-asset-depreciation')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(request('asset_name'), fn($q) => $q->whereHas('asset', fn($query) => $query->where('name', 'like', '%' . request('asset_name') . '%')))
                ->when(request('depreciation_method') && request('depreciation_method') !== 'all', fn($q) => $q->where('depreciation_method', request('depreciation_method')))
                ->when(request('start_date'), fn($q) => $q->whereDate('depreciation_start_date', request('start_date')))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            $assets = Asset::where('created_by', creatorId())
                ->select('id', 'name', 'purchase_cost')
                ->get();

            return Inertia::render('Assets/AssetDepreciation/Index', [
                'depreciations' => $depreciations,
                'assets' => $assets,
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreAssetDepreciationRequest $request)
    {
        if(Auth::user()->can('create-asset-depreciation')){
            $validated = $request->validated();
            $asset = Asset::findOrFail($validated['asset_id']);

            $depreciation = new AssetDepreciation();
            $depreciation->asset_id = $validated['asset_id'];
            $depreciation->depreciation_method = $validated['depreciation_method'];
            $depreciation->useful_life_years = $validated['useful_life_years'];
            $depreciation->salvage_value = $validated['salvage_value'];
            $depreciation->depreciation_start_date = $validated['depreciation_start_date'];
            $depreciation->notes = $validated['notes'];

            // Calculate depreciation
            $cost = $asset->purchase_cost ?? 0;
            $salvageValue = $validated['salvage_value'];
            $usefulLife = $validated['useful_life_years'];

            switch ($validated['depreciation_method']) {
                case 'straight_line':
                    $depreciation->annual_depreciation = ($cost - $salvageValue) / $usefulLife;
                    break;
                case 'declining_balance':
                    $rate = 2 / $usefulLife; // Double declining balance
                    $depreciation->annual_depreciation = $cost * $rate;
                    break;
                case 'sum_of_years':
                    $sumOfYears = ($usefulLife * ($usefulLife + 1)) / 2;
                    $depreciation->annual_depreciation = (($cost - $salvageValue) * $usefulLife) / $sumOfYears;
                    break;
            }

            // Calculate accumulated depreciation based on time elapsed
            $startDate = \Carbon\Carbon::parse($validated['depreciation_start_date']);
            $currentDate = \Carbon\Carbon::now();
            $yearsElapsed = $startDate->diffInYears($currentDate, false);
            
            if ($yearsElapsed > 0) {
                $accumulatedDepreciation = min($depreciation->annual_depreciation * $yearsElapsed, $cost - $salvageValue);
                $depreciation->accumulated_depreciation = $accumulatedDepreciation;
                $depreciation->book_value = max($cost - $accumulatedDepreciation, $salvageValue);
                $depreciation->is_fully_depreciated = $accumulatedDepreciation >= ($cost - $salvageValue);
            } else {
                $depreciation->accumulated_depreciation = 0;
                $depreciation->book_value = $cost;
                $depreciation->is_fully_depreciated = false;
            }
            
            $depreciation->last_calculated_date = $currentDate;
            $depreciation->creator_id = Auth::id();
            $depreciation->created_by = creatorId();
            $depreciation->save();

            CreateAssetDepreciation::dispatch($request, $depreciation);

            return redirect()->route('assets.asset-depreciation.index')->with('success', __('The depreciation record has been created successfully.'));
        }
        else{
            return redirect()->route('assets.asset-depreciation.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateAssetDepreciationRequest $request, AssetDepreciation $assetDepreciation)
    {
        if(Auth::user()->can('edit-asset-depreciation')){
            $validated = $request->validated();
            $asset = Asset::findOrFail($validated['asset_id']);

            $assetDepreciation->asset_id = $validated['asset_id'];
            $assetDepreciation->depreciation_method = $validated['depreciation_method'];
            $assetDepreciation->useful_life_years = $validated['useful_life_years'];
            $assetDepreciation->salvage_value = $validated['salvage_value'];
            $assetDepreciation->depreciation_start_date = $validated['depreciation_start_date'];
            $assetDepreciation->notes = $validated['notes'];

            // Recalculate depreciation
            $cost = $asset->purchase_cost ?? 0;
            $salvageValue = $validated['salvage_value'];
            $usefulLife = $validated['useful_life_years'];

            switch ($validated['depreciation_method']) {
                case 'straight_line':
                    $assetDepreciation->annual_depreciation = ($cost - $salvageValue) / $usefulLife;
                    break;
                case 'declining_balance':
                    $rate = 2 / $usefulLife; // Double declining balance
                    $assetDepreciation->annual_depreciation = $cost * $rate;
                    break;
                case 'sum_of_years':
                    $sumOfYears = ($usefulLife * ($usefulLife + 1)) / 2;
                    $assetDepreciation->annual_depreciation = (($cost - $salvageValue) * $usefulLife) / $sumOfYears;
                    break;
            }

            // Recalculate accumulated depreciation based on time elapsed
            $startDate = \Carbon\Carbon::parse($validated['depreciation_start_date']);
            $currentDate = \Carbon\Carbon::now();
            $yearsElapsed = $startDate->diffInYears($currentDate, false);
            
            if ($yearsElapsed > 0) {
                $accumulatedDepreciation = min($assetDepreciation->annual_depreciation * $yearsElapsed, $cost - $salvageValue);
                $assetDepreciation->accumulated_depreciation = $accumulatedDepreciation;
                $assetDepreciation->book_value = max($cost - $accumulatedDepreciation, $salvageValue);
                $assetDepreciation->is_fully_depreciated = $accumulatedDepreciation >= ($cost - $salvageValue);
            } else {
                $assetDepreciation->accumulated_depreciation = 0;
                $assetDepreciation->book_value = $cost;
                $assetDepreciation->is_fully_depreciated = false;
            }
            
            $assetDepreciation->last_calculated_date = $currentDate;
            $assetDepreciation->save();

            UpdateAssetDepreciation::dispatch($request, $assetDepreciation);

            return back()->with('success', __('The depreciation record details are updated successfully.'));
        }
        else{
            return redirect()->route('assets.asset-depreciation.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(AssetDepreciation $assetDepreciation)
    {
        if(Auth::user()->can('delete-asset-depreciation')){
            DestroyAssetDepreciation::dispatch($assetDepreciation);

            $assetDepreciation->delete();
            return back()->with('success', __('The depreciation record has been deleted.'));
        }
        else{
            return redirect()->route('assets.asset-depreciation.index')->with('error', __('Permission denied'));
        }
    }
}
