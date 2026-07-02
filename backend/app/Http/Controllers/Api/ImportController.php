<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CustomerImportService;
use Illuminate\Http\Request;

class ImportController extends Controller
{
    /** Import customers + subscriptions from an uploaded CSV (all-or-nothing). */
    public function customers(Request $request, CustomerImportService $import)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:1024', 'mimes:csv,txt'],
        ]);

        $result = $import->import($request->file('file')->get(), $request->user()->team_id);

        if (isset($result['errors'])) {
            return response()->json(['message' => 'import_failed', 'rows' => $result['errors']], 422);
        }

        return response()->json($result);
    }
}
