<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Automation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'condition',
        'action',
        'is_active',
        'trigger_count',
        'last_triggered_at',
    ];

    protected $casts = [
        'condition'         => 'array',
        'action'            => 'array',
        'is_active'         => 'boolean',
        'trigger_count'     => 'integer',
        'last_triggered_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
