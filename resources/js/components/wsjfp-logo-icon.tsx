import { SVGAttributes } from 'react';

export default function WSJFPLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 120 42" xmlns="http://www.w3.org/2000/svg">
            {/* W */}
            <path
                d="M16 8L12 34H8L5.5 17.5L3 34H-1L-5 8H0L2.5 27L5.5 8H9L12 27L14.5 8H16Z"
                transform="translate(12, 0)"
                fillRule="evenodd"
            />
            {/* S */}
            <path
                d="M14 12.5C14 9.5 11.5 8 8 8C4.5 8 2 9.5 2 12C2 17 14 16 14 22C14 25.5 11 27 7.5 27C3.5 27 0.5 25 0.5 21H5C5 23 6.5 24 8 24C9.5 24 11 23 11 21C11 16 -1 17 -1 11C-1 7.5 2 5 7.5 5C12 5 14.5 7.5 14.5 11L14 12.5Z"
                transform="translate(32, 3)"
                fillRule="evenodd"
            />
            {/* J */}
            <path
                d="M8 8V24C8 28 5 29 2 29C-2 29 -4 26.5 -4 23H1C1 24.5 1.5 26 3 26C4.5 26 5 24.5 5 23V8H8Z"
                transform="translate(54, 5)"
                fillRule="evenodd"
            />
            {/* F */}
            <path
                d="M0 8H12V11H3V19H10V22H3V34H0V8Z"
                transform="translate(70, 0)"
                fillRule="evenodd"
            />
            {/* P */}
            <path
                d="M0 8H9C12.5 8 14.5 10.5 14.5 14.5C14.5 18.5 12.5 21 9 21H3V34H0V8ZM3 18H8.5C10.5 18 11.5 16.5 11.5 14.5C11.5 12.5 10.5 11 8.5 11H3V18Z"
                transform="translate(87, 0)"
                fillRule="evenodd"
            />
            
            {/* Priority bar chart symbol */}
            <rect x="12" y="36" width="8" height="2" />
            <rect x="24" y="34" width="8" height="4" />
            <rect x="36" y="32" width="8" height="6" />
            <rect x="48" y="30" width="8" height="8" />
            <rect x="60" y="28" width="8" height="10" />
            <rect x="72" y="26" width="8" height="12" />
            <rect x="84" y="24" width="8" height="14" />
            <rect x="96" y="22" width="8" height="16" />
        </svg>
    );
}