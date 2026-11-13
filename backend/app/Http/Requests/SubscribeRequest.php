<?php

namespace App\Http\Requests;

use App\Services\BillingService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubscribeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'plan_code' => ['required', 'string', 'max:50', 'exists:subscription_plans,code'],
            'billing_cycle' => ['required', 'string', Rule::in(['monthly', 'yearly'])],
            'payment_method' => [
                'nullable',
                'string',
                Rule::in(array_keys(BillingService::PAYMENT_METHODS)),
            ],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'plan_code.required' => 'Pilih paket langganan terlebih dahulu.',
            'plan_code.exists' => 'Paket langganan yang dipilih tidak valid.',
            'billing_cycle.in' => 'Siklus penagihan harus bulanan atau tahunan.',
            'payment_method.in' => 'Metode pembayaran yang dipilih tidak didukung.',
        ];
    }
}

