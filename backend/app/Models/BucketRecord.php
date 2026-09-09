<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BucketRecord extends Model
{
    use HasFactory;

    protected $fillable = ['data_bucket_id', 'data', 'recorded_at'];

    protected $casts = [
        'data' => 'array',
        'recorded_at' => 'datetime',
    ];

    public function bucket()
    {
        return $this->belongsTo(DataBucket::class, 'data_bucket_id');
    }
}
