@extends('app')

@section('content')
<div class="container mx-auto py-8">
    <h1 class="text-2xl font-bold mb-4">Benutzer bearbeiten</h1>
    <form action="{{ route('users.update', $user) }}" method="POST" class="space-y-4">
        @csrf
        @method('PUT')
        <div>
            <label class="block">Name</label>
            <input type="text" name="name" value="{{ $user->name }}" class="border rounded w-full" required>
        </div>
        <div>
            <label class="block">E-Mail</label>
            <input type="email" name="email" value="{{ $user->email }}" class="border rounded w-full" required>
        </div>
        <div>
            <label class="block">Passwort (leer lassen für keine Änderung)</label>
            <input type="password" name="password" class="border rounded w-full">
        </div>
        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Aktualisieren</button>
        <a href="{{ route('users.index') }}" class="ml-2 text-gray-600">Abbrechen</a>
    </form>
</div>
@endsection