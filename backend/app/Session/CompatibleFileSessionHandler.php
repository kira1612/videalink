<?php

namespace App\Session;

use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Carbon;
use SessionHandlerInterface;
use Symfony\Component\Finder\Finder;

/**
 * PHP 8.6+ compatible file session handler.
 *
 * PHP 8.6 emits E_WARNING when a SessionHandlerInterface implementation
 * omits create_sid() or validateId(), which Laravel's HandleExceptions
 * converts into an ErrorException (HTTP 500).
 */
class CompatibleFileSessionHandler implements SessionHandlerInterface
{
    protected Filesystem $files;

    protected string $path;

    protected int $minutes;

    public function __construct(Filesystem $files, string $path, int $minutes)
    {
        $this->files = $files;
        $this->path = $path;
        $this->minutes = $minutes;
    }

    public function open($savePath, $sessionName): bool
    {
        return true;
    }

    public function close(): bool
    {
        return true;
    }

    public function read($sessionId): string|false
    {
        if ($this->files->isFile($path = $this->path.'/'.$sessionId) &&
            $this->files->lastModified($path) >= Carbon::now()->subMinutes($this->minutes)->getTimestamp()) {
            return $this->files->sharedGet($path);
        }

        return '';
    }

    public function write($sessionId, $data): bool
    {
        $this->files->put($this->path.'/'.$sessionId, $data, true);

        return true;
    }

    public function destroy($sessionId): bool
    {
        $this->files->delete($this->path.'/'.$sessionId);

        return true;
    }

    public function gc($lifetime): int|false
    {
        $files = Finder::create()
            ->in($this->path)
            ->files()
            ->ignoreDotFiles(true)
            ->date('<= now - '.$lifetime.' seconds');

        $deletedSessions = 0;

        foreach ($files as $file) {
            $this->files->delete($file->getRealPath());
            $deletedSessions++;
        }

        return $deletedSessions;
    }

    public function create_sid(): string
    {
        return bin2hex(random_bytes(20));
    }

    public function validateId(string $id): bool
    {
        return preg_match('/\A[a-zA-Z0-9,-]{1,128}\z/', $id) === 1
            && $this->files->isFile($this->path.'/'.$id);
    }
}
