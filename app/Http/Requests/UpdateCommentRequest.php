<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCommentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $comment = $this->route('comment');
        
        // User can only update their own comments
        return auth()->check() && 
               $comment && 
               $comment->user_id === auth()->id();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:1', 'max:5000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'body.required' => 'Der Kommentar darf nicht leer sein.',
            'body.min' => 'Der Kommentar muss mindestens ein Zeichen enthalten.',
            'body.max' => 'Der Kommentar darf maximal 5000 Zeichen enthalten.',
        ];
    }
}
