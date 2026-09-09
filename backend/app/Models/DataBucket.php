<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DataBucket extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id', 'name', 'description', 'enabled', 'fields', 'widgets', 'mqtt_topic'
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'fields' => 'array',
        'widgets' => 'array',
    ];

    protected $appends = ['records_count', 'size', 'last_write'];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function records()
    {
        return $this->hasMany(BucketRecord::class);
    }

    public function getRecordsCountAttribute()
    {
        return $this->records()->count();
    }

    public function getSizeAttribute()
    {
        $bytes = $this->records()->count() * 128;
        if ($bytes < 1024) return $bytes . ' B';
        if ($bytes < 1048576) return round($bytes / 1024, 1) . ' KB';
        return round($bytes / 1048576, 1) . ' MB';
    }

    public function getLastWriteAttribute()
    {
        return $this->records()->latest('recorded_at')->value('recorded_at');
    }
}
