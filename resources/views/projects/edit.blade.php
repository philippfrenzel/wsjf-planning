{{-- filepath: /workspaces/react-starter-kit/resources/views/projects/edit.blade.php --}}
@extends('layouts.app')

@section('content')
    <h1>Projekt bearbeiten</h1>
    <form action="{{ route('projects.update', ['project' => $project->id]) }}" method="POST">
        @csrf
        @method('PUT')

        <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" class="form-control" value="{{ old('name', $project->name) }}" required>
        </div>

        <div class="form-group">
            <label for="project_number">Projektnummer</label>
            <input type="text" id="project_number" name="project_number" class="form-control" value="{{ old('project_number', $project->project_number) }}" required>
        </div>

        <div class="form-group">
            <label for="description">Beschreibung</label>
            <textarea id="description" name="description" class="form-control">{{ old('description', $project->description) }}</textarea>
        </div>

        <button type="submit" class="btn btn-primary">Speichern</button>
        <a href="{{ route('projects.index') }}" class="btn btn-secondary">Abbrechen</a>
    </form>
@endsection