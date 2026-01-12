export interface CommentUser {
    id: number;
    name: string;
    avatar?: string;
}

export interface Comment {
    id: number;
    body: string;
    user: CommentUser;
    parent_id: number | null;
    replies?: Comment[];
    created_at: string;
    updated_at: string;
    is_owner: boolean;
}

export interface CommentableEntity {
    type: string;
    id: number;
}
