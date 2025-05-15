{{-- filepath: /workspaces/react-starter-kit/resources/views/projects/show.blade.php --}}
@extends('layouts.app')

@section('content')
    <h1>Projekt anzeigen</h1>
    <p><strong>ID:</strong> {{ $project->id }}</p>
    <p><strong>Projektnummer:</strong> {{ $project->project_number }}</p>
    <p><strong>Name:</strong> {{ $project->name }}</p>
    <a href="{{ route('projects.index') }}" class="btn btn-secondary">Zurück zur Übersicht</a>
@endsection