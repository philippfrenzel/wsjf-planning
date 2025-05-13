<?php
@extends('layouts.app')

@section('content')
    <h1>Projekte</h1>
    <a href="{{ route('projects.create') }}" class="btn btn-primary">Neues Projekt erstellen</a>
    <table class="table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Projektnummer</th>
                <th>Name</th>
                <th>Aktionen</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($projects as $project)
                <tr>
                    <td>{{ $project->id }}</td>
                    <td>{{ $project->project_number }}</td>
                    <td>{{ $project->name }}</td>
                    <td>
                        <a href="{{ route('projects.show', $project) }}" class="btn btn-info">Anzeigen</a>
                        <a href="{{ route('projects.edit', $project) }}" class="btn btn-warning">Bearbeiten</a>
                        <form action="{{ route('projects.destroy', $project) }}" method="POST" style="display:inline;">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="btn btn-danger">Löschen</button>
                        </form>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection