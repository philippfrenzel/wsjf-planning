import { SVGAttributes } from 'react';

// Lean WSJF glyph: prioritized bars + trajectory check.
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="22" width="6" height="11" rx="2" fill="currentColor" opacity="0.35" />
            <rect x="17" y="16" width="6" height="17" rx="2" fill="currentColor" opacity="0.6" />
            <rect x="27" y="10" width="6" height="23" rx="2" fill="currentColor" />
            <path
                d="M8 28L17 19L22 23L32 13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="32" cy="13" r="2" fill="currentColor" />
        </svg>
    );
}
