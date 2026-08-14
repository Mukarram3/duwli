<?php

namespace Workdo\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Assets\Models\AssetLocation;
use Workdo\Assets\Http\Requests\StoreAssetLocationRequest;
use Workdo\Assets\Http\Requests\UpdateAssetLocationRequest;
use Workdo\Assets\Events\CreateAssetLocation;
use Workdo\Assets\Events\UpdateAssetLocation;
use Workdo\Assets\Events\DestroyAssetLocation;

class AssetLocationController extends Controller
{
    public function index()
    {
        if(Auth::user()->can('manage-asset-locations')){
            $assetLocations = AssetLocation::query()
                ->with(['parent'])
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-asset-locations')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-asset-locations')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(request('name'), fn($q) => $q->where('name', 'like', '%' . request('name') . '%'))
                ->when(request('code'), fn($q) => $q->where('code', 'like', '%' . request('code') . '%'))
                ->when(request('type') && request('type') !== 'all', fn($q) => $q->where('type', request('type')))
                ->when(request('is_active') && request('is_active') !== 'all', fn($q) => $q->where('is_active', request('is_active') === '1'))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            $activeLocations = AssetLocation::where('created_by', creatorId())
                ->where('is_active', true)
                ->select('id', 'name')
                ->get();

            return Inertia::render('Assets/AssetLocations/Index', [
                'assetLocations' => $assetLocations,
                'activeLocations' => $activeLocations,
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreAssetLocationRequest $request)
    {
        if(Auth::user()->can('create-asset-locations')){
            $validated = $request->validated();

            $assetLocation = new AssetLocation();
            $assetLocation->name = $validated['name'];
            $assetLocation->code = $validated['code'];
            $assetLocation->type = $validated['type'];
            $assetLocation->parent_id = $validated['parent_id'];
            $assetLocation->address = $validated['address'];
            $assetLocation->city = $validated['city'];
            $assetLocation->state = $validated['state'];
            $assetLocation->country = $validated['country'];
            $assetLocation->postal_code = $validated['postal_code'];
            $assetLocation->contact_person = $validated['contact_person'];
            $assetLocation->contact_phone = $validated['contact_phone'];
            $assetLocation->contact_email = $validated['contact_email'];
            $assetLocation->description = $validated['description'];
            $assetLocation->is_active = $validated['is_active'] ?? true;
            $assetLocation->creator_id = Auth::id();
            $assetLocation->created_by = creatorId();
            $assetLocation->save();

            CreateAssetLocation::dispatch($request, $assetLocation);

            return redirect()->route('assets.asset-locations.index')->with('success', __('The asset location has been created successfully.'));
        }
        else{
            return redirect()->route('assets.asset-locations.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateAssetLocationRequest $request, AssetLocation $assetLocation)
    {
        if(Auth::user()->can('edit-asset-locations')){
            $validated = $request->validated();

            $assetLocation->name = $validated['name'];
            $assetLocation->code = $validated['code'];
            $assetLocation->type = $validated['type'];
            $assetLocation->parent_id = $validated['parent_id'];
            $assetLocation->address = $validated['address'];
            $assetLocation->city = $validated['city'];
            $assetLocation->state = $validated['state'];
            $assetLocation->country = $validated['country'];
            $assetLocation->postal_code = $validated['postal_code'];
            $assetLocation->contact_person = $validated['contact_person'];
            $assetLocation->contact_phone = $validated['contact_phone'];
            $assetLocation->contact_email = $validated['contact_email'];
            $assetLocation->description = $validated['description'];
            $assetLocation->is_active = $validated['is_active'] ?? true;
            $assetLocation->save();

            UpdateAssetLocation::dispatch($request, $assetLocation);

            return back()->with('success', __('The asset location details are updated successfully.'));
        }
        else{
            return redirect()->route('assets.asset-locations.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(AssetLocation $assetLocation)
    {
        if(Auth::user()->can('delete-asset-locations')){
            DestroyAssetLocation::dispatch($assetLocation);

            $assetLocation->delete();

            return back()->with('success', __('The asset location has been deleted.'));
        }
        else{
            return redirect()->route('assets.asset-locations.index')->with('error', __('Permission denied'));
        }
    }

    public function getParentLocations()
    {
        $locations = AssetLocation::where('created_by', creatorId())
            ->where('is_active', true)
            ->select('id', 'name', 'code')
            ->get();

        return response()->json($locations);
    }
}