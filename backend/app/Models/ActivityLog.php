<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = ['device_id', 'device_name', 'event', 'type'];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
