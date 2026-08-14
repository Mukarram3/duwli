<?php

namespace Workdo\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Assets\Models\AssetAssignment;
use Workdo\Assets\Models\Asset;
use App\Models\User;
use Workdo\Assets\Http\Requests\StoreAssetAssignmentRequest;
use Workdo\Assets\Http\Requests\UpdateAssetAssignmentRequest;
use Workdo\Assets\Http\Requests\ReturnAssetRequest;
use Workdo\Assets\Events\CreateAssetAssignment;
use Workdo\Assets\Events\UpdateAssetAssignment;
use Workdo\Assets\Events\DestroyAssetAssignment;
use Workdo\Assets\Events\ReturnAsset;

class AssetAssignmentController extends Controller
{
    public function index()
    {
        $assetAssignments = AssetAssignment::query()
            ->with(['asset.category', 'user', 'assignedBy', 'returnedBy'])
            ->where(function($q) {
                if(Auth::user()->can('manage-asset-assignments')) {
                    if(Auth::user()->can('manage-any-asset-assignments')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-asset-assignments')) {
                        $q->where('creator_id', Auth::id())->orWhere('user_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                } else {
                    // Show only assignments for logged-in user
                    $q->where('user_id', Auth::id());
                }
            })
            ->when(request('asset_name'), fn($q) => $q->whereHas('asset', fn($sq) => $sq->where('name', 'like', '%' . request('asset_name') . '%')))
            ->when(request('user_name') && request('user_name') !== 'all', fn($q) => $q->where('user_id', request('user_name')))
            ->when(request('status') && request('status') !== 'all', fn($q) => $q->where('status', request('status')))
            ->when(request('condition') && request('condition') !== 'all', fn($q) => $q->where('condition_on_assignment', request('condition')))
            ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
            ->paginate(request('per_page', 10))
            ->withQueryString();

        return Inertia::render('Assets/AssetAssignments/Index', [
            'assetAssignments' => $assetAssignments,
        ]);
    }

    public function store(StoreAssetAssignmentRequest $request)
    {
        if(Auth::user()->can('create-asset-assignments')){
            $validated = $request->validated();

            $assetAssignment = new AssetAssignment();
            $assetAssignment->asset_id = $validated['asset_id'];
            $assetAssignment->user_id = $validated['user_id'];
            $assetAssignment->assigned_date = $validated['assigned_date'];
            $assetAssignment->expected_return_date = $validated['expected_return_date'];
            $assetAssignment->condition_on_assignment = $validated['condition_on_assignment'];
            $assetAssignment->assignment_notes = $validated['assignment_notes'];
            $assetAssignment->assigned_by = Auth::id();
            $assetAssignment->creator_id = Auth::id();
            $assetAssignment->created_by = creatorId();
            $assetAssignment->save();

            CreateAssetAssignment::dispatch($request, $assetAssignment);

            return redirect()->route('assets.asset-assignments.index')->with('success', __('The asset assignment has been created successfully.'));
        }
        else{
            return redirect()->route('assets.asset-assignments.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateAssetAssignmentRequest $request, AssetAssignment $assetAssignment)
    {
        if(Auth::user()->can('edit-asset-assignments')){
            $validated = $request->validated();

            $assetAssignment->asset_id = $validated['asset_id'];
            $assetAssignment->user_id = $validated['user_id'];
            $assetAssignment->assigned_date = $validated['assigned_date'];
            $assetAssignment->expected_return_date = $validated['expected_return_date'];
            $assetAssignment->condition_on_assignment = $validated['condition_on_assignment'];
            $assetAssignment->assignment_notes = $validated['assignment_notes'];
            $assetAssignment->save();

            UpdateAssetAssignment::dispatch($request, $assetAssignment);

            return back()->with('success', __('The asset assignment details are updated successfully.'));
        }
        else{
            return redirect()->route('assets.asset-assignments.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(AssetAssignment $assetAssignment)
    {
        if(Auth::user()->can('delete-asset-assignments')){
            DestroyAssetAssignment::dispatch($assetAssignment);

            $assetAssignment->delete();

            return back()->with('success', __('The asset assignment has been deleted.'));
        }
        else{
            return redirect()->route('assets.asset-assignments.index')->with('error', __('Permission denied'));
        }
    }

    public function returnAsset(ReturnAssetRequest $request, AssetAssignment $assetAssignment)
    {
        if(Auth::user()->can('return-assets')){
            $validated = $request->validated();

            $assetAssignment->returned_date = $validated['returned_date'];
            $assetAssignment->condition_on_return = $validated['condition_on_return'];
            $assetAssignment->return_notes = $validated['return_notes'];
            $assetAssignment->returned_by = Auth::id();
            $assetAssignment->status = 'returned';
            $assetAssignment->save();

            ReturnAsset::dispatch($request, $assetAssignment);

            return back()->with('success', __('The asset has been returned successfully.'));
        }
        else{
            return redirect()->route('assets.asset-assignments.index')->with('error', __('Permission denied'));
        }
    }

    public function overdue()
    {
        if(Auth::user()->can('manage-asset-assignments')){
            $overdueAssignments = AssetAssignment::query()
                ->with(['asset.category', 'user', 'assignedBy'])
                ->where('status', 'active')
                ->where('expected_return_date', '<', now())
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-asset-assignments')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-asset-assignments')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->paginate(request('per_page', 10))
                ->withQueryString();

            return Inertia::render('Assets/AssetAssignments/Overdue', [
                'overdueAssignments' => $overdueAssignments,
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function getAvailableAssets()
    {
        $assets = Asset::where('created_by', creatorId())
            ->whereDoesntHave('assignments', function($q) {
                $q->where('status', 'active');
            })
            ->select('id', 'name', 'serial_code')
            ->get();

        return response()->json($assets);
    }

    public function getUsers()
    {
        $users = User::where('created_by', creatorId())
            ->where('type', '!=', 'super admin')
            ->select('id', 'name', 'email')
            ->get();

        return response()->json($users);
    }
}
