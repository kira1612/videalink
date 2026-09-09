<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Endpoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id', 'name', 'description', 'type',
        'enabled', 'config', 'trigger_count', 'last_triggered_at',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'config' => 'array',
        'last_triggered_at' => 'datetime',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
