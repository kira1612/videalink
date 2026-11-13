<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubscribeRequest;
use App\Models\Invoice;
use App\Services\BillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function __construct(
        private readonly BillingService $billingService
    ) {}

    public function plans(): JsonResponse
    {
        return response()->json([
            'plans' => $this->billingService->getPlans(),
        ]);
    }

    public function current(Request $request): JsonResponse
    {
        return response()->json(
            $this->billingService->getCurrentBillingSummary($request->user())
        );
    }

    public function subscribe(SubscribeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $planCode = $validated['plan_code'];
        if ($planCode !== 'starter' && empty($validated['payment_method'])) {
            return response()->json([
                'message' => 'Metode pembayaran wajib dipilih untuk paket berbayar.',
            ], 422);
        }

        $result = $this->billingService->subscribe($request->user(), $validated);

        return response()->json([
            'message' => $result['idempotent_replay']
                ? 'Transaksi sudah diproses sebelumnya.'
                : 'Pembelian paket berhasil diproses.',
            ...$result,
        ], $result['idempotent_replay'] ? 200 : 201);
    }

    public function cancel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $summary = $this->billingService->cancel(
            $request->user(),
            $validated['reason'] ?? null
        );

        return response()->json([
            'message' => 'Perpanjangan otomatis dibatalkan. Paket tetap aktif hingga akhir periode.',
            'summary' => $summary,
        ]);
    }

    public function resume(Request $request): JsonResponse
    {
        $summary = $this->billingService->resume($request->user());

        return response()->json([
            'message' => 'Langganan Anda kembali dilanjutkan dengan perpanjangan otomatis.',
            'summary' => $summary,
        ]);
    }

    public function invoices(Request $request): JsonResponse
    {
        return response()->json([
            'invoices' => $this->billingService->getInvoices($request->user()),
        ]);
    }

    public function showInvoice(Request $request, Invoice $invoice): JsonResponse
    {
        if ((int) $invoice->user_id !== (int) $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        return response()->json([
            'invoice' => $this->billingService->formatInvoice($invoice),
        ]);
    }
}

