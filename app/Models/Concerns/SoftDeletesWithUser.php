<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

trait SoftDeletesWithUser
{
    use SoftDeletes;

    /**
     * Perform the soft delete on the model while tracking the deleting user.
     */
    protected function runSoftDelete(): void
    {
        $query = $this->setKeysForSaveQuery($this->newModelQuery());

        $time = $this->freshTimestamp();
        $deletedAtColumn = $this->getDeletedAtColumn();
        $deletedByColumn = $this->getDeletedByColumn();

        $columns = [$deletedAtColumn => $this->fromDateTime($time)];
        $this->{$deletedAtColumn} = $time;

        if ($this->usesTimestamps() && ! is_null($this->getUpdatedAtColumn())) {
            $this->{$this->getUpdatedAtColumn()} = $time;
            $columns[$this->getUpdatedAtColumn()] = $this->fromDateTime($time);
        }

        $userId = Auth::id();
        $this->setAttribute($deletedByColumn, $userId);
        $columns[$deletedByColumn] = $userId;

        $query->update($columns);

        $this->syncOriginalAttributes(array_keys($columns));

        $this->fireModelEvent('trashed', false);
    }

    /**
     * Restore the soft-deleted model and reset the deleting user information.
     */
    public function restore(): bool
    {
        if ($this->fireModelEvent('restoring') === false) {
            return false;
        }

        $this->{$this->getDeletedAtColumn()} = null;
        $this->setAttribute($this->getDeletedByColumn(), null);

        $this->exists = true;

        $result = $this->save();

        $this->fireModelEvent('restored', false);

        return $result;
    }

    /**
     * Get the name of the "deleted by" column.
     */
    public function getDeletedByColumn(): string
    {
        return defined('static::DELETED_BY') ? static::DELETED_BY : 'deleted_by';
    }
}
