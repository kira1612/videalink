<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'name', 'type', 'protocol', 'broker_config', 'credentials', 'status', 'ip',
        'location', 'firmware', 'signal', 'uptime',
        'tags', 'resources', 'last_seen_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'resources' => 'array',
        'broker_config' => 'array',
        'last_seen_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
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
