<?php

namespace App\Providers;

use App\Session\CompatibleFileSessionHandler;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Session::extend('file', function ($app) {
            return new CompatibleFileSessionHandler(
                $app->make('files'),
                $app['config']->get('session.files'),
                (int) $app['config']->get('session.lifetime', 120)
            );
        });
    }
}
