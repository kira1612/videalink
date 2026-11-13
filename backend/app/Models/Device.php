<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id', 'room_id', 'name', 'type', 'protocol', 'broker_config', 'credentials', 'status', 'ip',
        'location', 'firmware', 'signal', 'uptime',
        'tags', 'resources', 'last_seen_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'resources' => 'array',
        'broker_config' => 'array',
        'last_seen_at' => 'datetime',
    ];

    /**
     * Heartbeat Timeout (Default: 60 detik).
     * Jika perangkat tidak mengirim telemetri/ping lebih dari 60 detik,
     * statusnya otomatis dianggap offline.
     */
    public function getStatusAttribute($value)
    {
        if (!$this->last_seen_at) {
            return 'offline';
        }

        // Heartbeat timeout threshold: 60 seconds
        if ($this->last_seen_at->lt(now()->subSeconds(60))) {
            return 'offline';
        }

        return $value ?? 'online';
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function dataBuckets()
    {
        return $this->hasMany(DataBucket::class);
    }

    public function endpoints()
    {
        return $this->hasMany(Endpoint::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }
}
