<?php

namespace App\Listeners;

use Laravel\Cashier\Events\WebhookReceived;
use Illuminate\Support\Facades\Log;

class StripeEventListener
{
    public function handle(WebhookReceived $event): void
    {
        $type = $event->payload['type'] ?? '';

        match ($type) {
            'invoice.payment_succeeded' => $this->handlePaymentSucceeded($event->payload),
            'invoice.payment_failed'    => $this->handlePaymentFailed($event->payload),
            default                     => null,
        };
    }

    private function handlePaymentSucceeded(array $payload): void
    {
        $customerId = $payload['data']['object']['customer'] ?? null;
        Log::info('Stripe invoice payment succeeded', [
            'customer_id' => $customerId,
            'amount_paid' => $payload['data']['object']['amount_paid'] ?? null,
        ]);
        // Future: notify tenant owner of successful charge
    }

    private function handlePaymentFailed(array $payload): void
    {
        $customerId = $payload['data']['object']['customer'] ?? null;
        Log::warning('Stripe invoice payment failed', [
            'customer_id'   => $customerId,
            'attempt_count' => $payload['data']['object']['attempt_count'] ?? null,
        ]);
        // Future: notify tenant owner of failed payment, prompt card update
    }
}
