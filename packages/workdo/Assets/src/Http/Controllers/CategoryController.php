<?php

namespace Workdo\Assets\Http\Controllers;

use Workdo\Assets\Http\Requests\StoreCategoryRequest;
use Workdo\Assets\Http\Requests\UpdateCategoryRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Assets\Events\CreateAssetsCategory;
use Workdo\Assets\Events\DestroyAssetsCategory;
use Workdo\Assets\Events\UpdateAssetsCategory;
use Workdo\Assets\Models\AssetsCategory;

class CategoryController extends Controller
{
    public function index()
    {
        if(Auth::user()->can('manage-asset-categories')){
            $categories = AssetsCategory::select('id', 'name', 'created_at')
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-asset-categories')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-asset-categories')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(request('name'), fn($q) => $q->where('name', 'like', '%' . request('name') . '%'))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            return Inertia::render('Assets/Categories/Index', [
                'categories' => $categories,

            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreCategoryRequest $request)
    {
        if(Auth::user()->can('create-asset-categories')){
            $validated = $request->validated();

            $category = new AssetsCategory();
            $category->name = $validated['name'];

            $category->creator_id = Auth::id();
            $category->created_by = creatorId();
            $category->save();

            // Dispatch event for packages to handle their fields
            CreateAssetsCategory::dispatch($request, $category);

            return redirect()->route('assets.categories.index')->with('success', __('The category has been created successfully.'));
        }
        else{
            return redirect()->route('assets.categories.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateCategoryRequest $request, AssetsCategory $category)
    {
        if(Auth::user()->can('edit-asset-categories')){
            $validated = $request->validated();

            $category->name = $validated['name'];

            $category->save();

            UpdateAssetsCategory::dispatch($request, $category);

            return redirect()->route('assets.categories.index')->with('success', __('The category details are updated successfully.'));
        }
        else{
            return redirect()->route('assets.categories.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(AssetsCategory $category)
    {
        if(Auth::user()->can('delete-asset-categories')){
            DestroyAssetsCategory::dispatch($category);
            $category->delete();

            return redirect()->route('assets.categories.index')->with('success', __('The category has been deleted.'));
        }
        else{
            return redirect()->route('assets.categories.index')->with('error', __('Permission denied'));
        }
    }
}
