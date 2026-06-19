<?php

namespace App\Enums;

/**
 * Subscription lifecycle event types. These drive every MRR-movement metric:
 * New + Expansion add revenue; Contraction + Churn remove it.
 */
enum EventType: string
{
    case New = 'new';
    case Expansion = 'expansion';
    case Contraction = 'contraction';
    case Churn = 'churn';
}
