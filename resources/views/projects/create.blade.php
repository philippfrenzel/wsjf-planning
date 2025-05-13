<?php
@extends('layouts.app')

@section('content')
    <h1>Neues Projekt erstellen</h1>
    <form action="{{ route('projects.store') }}" method="POST">
        @csrf
        <div class="form-group">
            <label for="project_number">Projektnummer</label>
            <input type="text" name="project_number" id="project_number" class="form-control" required>
        </div>
        <div class="form-group">
            <label for="name">Name</label>
            <input type="text" name="name" id="name" class="form-control" required>
        </div>
        <div class="form-group">
            <label for="description">Beschreibung</label>
            <textarea name="description" id="description" class="form-control"></textarea>
        </div>
        <div class="form-group">
            <label for="start_date">Startdatum</label>
            <input type="date" name="start_date" id="start_date" class="form-control" required>
        </div>
        <div class="form-group">
            <label for="project_leader_id">Projektleiter</label>
            <select name="project_leader_id" id="project_leader_id" class="form-control" required>
                @foreach ($users as $user)
                    <option value="{{ $user->id }}">{{ $user->name }}</option>
                @endforeach
            </select>
        </div>
        <div class="form-group">
            <label for="deputy_leader_id">Stellvertretender Projektleiter</label>
            <select name="deputy_leader_id" id="deputy_leader_id" class="form-control">
                <option value="">Keiner</option>
                @foreach ($users as $user)
                    <option value="{{ $user->id }}">{{ $user->name }}</option>
                @endforeach
            </select>
        </div>
        <button type="submit" class="btn btn-success">Erstellen</button>
    </form>
@endsection