{{-- filepath: /workspaces/react-starter-kit/resources/views/projects/edit.blade.php --}}
@extends('layouts.app')

@section('content')
    <h1>Projekt bearbeiten</h1>

    {{-- Validierungsfehler anzeigen --}}
    @if ($errors->any())
        <div class="alert alert-danger">
            <ul class="mb-0">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form action="{{ route('projects.update', ['project' => $project->id]) }}" method="POST">
        @csrf
        @method('PUT')

        <div class="form-group mb-3">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" class="form-control" value="{{ old('name', $project->name) }}" required>
        </div>

        <div class="form-group mb-3">
            <label for="project_number">Projektnummer</label>
            <input type="text" id="project_number" name="project_number" class="form-control" value="{{ old('project_number', $project->project_number) }}" required>
        </div>

        <div class="form-group mb-3">
            <label for="project_leader_id">Projektleiter</label>
            <select id="project_leader_id" name="project_leader_id" class="form-control" required>
                <option value="">-- Bitte wählen --</option>
                @foreach($users as $user)
                    <option value="{{ $user->id }}"
                        {{ old('project_leader_id', $project->project_leader_id) == $user->id ? 'selected' : '' }}>
                        {{ $user->name }}
                    </option>
                @endforeach
            </select>
        </div>

        <div class="form-group mb-3">
            <label for="description">Beschreibung</label>
            <textarea id="description" name="description" class="form-control">{{ old('description', $project->description) }}</textarea>
        </div>

        <div class="form-group mb-3">
            <label for="start_date">Startdatum</label>
            <input type="date" id="start_date" name="start_date" class="form-control" value="{{ old('start_date', $project->start_date) }}">
        </div>

        <div class="form-group mb-3">
            <label for="end_date">Enddatum</label>
            <input type="date" id="end_date" name="end_date" class="form-control" value="{{ old('end_date', $project->end_date) }}">
        </div>

        <div class="form-group mb-3">
            <label for="status">Status</label>
            <select id="status" name="status" class="form-control">
                <option value="offen" {{ old('status', $project->status) == 'offen' ? 'selected' : '' }}>Offen</option>
                <option value="in_bearbeitung" {{ old('status', $project->status) == 'in_bearbeitung' ? 'selected' : '' }}>In Bearbeitung</option>
                <option value="abgeschlossen" {{ old('status', $project->status) == 'abgeschlossen' ? 'selected' : '' }}>Abgeschlossen</option>
            </select>
        </div>

        <button type="submit" class="btn btn-primary">Speichern</button>
        <a href="{{ route('projects.index') }}" class="btn btn-secondary">Abbrechen</a>
    </form>
@endsection