<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'plan' => ['required', 'string', Rule::exists('plans', 'slug')->where('team_id', $this->user()->team_id)],
            // Optional real customer details; synthesized when omitted.
            'email' => ['nullable', 'email', 'max:190', Rule::unique('customers', 'email')->where('team_id', $this->user()->team_id)],
            'country' => ['nullable', 'string', 'max:80'],
            'country_code' => ['nullable', 'string', 'size:2'],
        ];
    }
}
