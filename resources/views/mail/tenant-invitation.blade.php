<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to {{ $invitation->tenant->name }}</title>
</head>
<body style="font-family: sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px;">
        <tr>
            <td>
                <h1 style="color: #1a1a1a; font-size: 22px; margin-bottom: 16px;">
                    You have been invited to join {{ $invitation->tenant->name }}
                </h1>
                <p style="color: #444; font-size: 15px; line-height: 1.6;">
                    {{ $invitation->inviter->name }} has invited you to join their WSJF Planning workspace.
                </p>
                <p style="margin: 24px 0;">
                    <a href="{{ route('tenants.invitations.accept', ['token' => $invitation->token]) }}"
                       style="background: #4f46e5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 15px; display: inline-block;">
                        Accept Invitation
                    </a>
                </p>
                <p style="color: #666; font-size: 13px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="{{ route('tenants.invitations.accept', ['token' => $invitation->token]) }}" style="color: #4f46e5; word-break: break-all;">
                        {{ route('tenants.invitations.accept', ['token' => $invitation->token]) }}
                    </a>
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                <p style="color: #999; font-size: 12px;">
                    This invitation expires on {{ $invitation->expires_at?->format('d M Y') ?? 'no expiry' }}.
                    If you did not expect this invitation, you can safely ignore this email.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
