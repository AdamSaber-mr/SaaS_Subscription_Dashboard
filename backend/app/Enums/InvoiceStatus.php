<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case Paid = 'paid';
    case Failed = 'failed';
    case Refunded = 'refunded';
}
