interface User {
    name: string;
    avatar: string | null;
    // andere User-Properties...
}

interface UserInfoProps {
    user: User | null;
}

export function UserInfo({ user }: UserInfoProps) {
    // Rendering mit Null-Check für user und avatar
    return (
        <div className="user-info">
            {user ? (
                <>
                    <div className="user-avatar">
                        {user.avatar ? (
                            <img src={user.avatar} alt={`${user.name}'s avatar`} />
                        ) : (
                            <div className="default-avatar">{user.name ? user.name.charAt(0).toUpperCase() : '?'}</div>
                        )}
                    </div>
                    <div className="user-name">{user.name}</div>
                </>
            ) : (
                <div className="loading-user">Loading user information...</div>
            )}
        </div>
    );
}
