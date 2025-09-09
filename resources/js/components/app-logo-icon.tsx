import { SVGAttributes } from 'react';

// Minimal WSJF Planner glyph: collaborative triad + ascending bars.
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
  return (
    <svg {...props} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 L10 24 L30 24 Z" />
      </g>
      <circle cx="20" cy="6" r="2.4" fill="currentColor" />
      <circle cx="10" cy="24" r="2.4" fill="currentColor" />
      <circle cx="30" cy="24" r="2.4" fill="currentColor" />
      <rect x="33" y="20" width="2" height="6" rx="1" fill="currentColor" />
      <rect x="36" y="16" width="2" height="10" rx="1" fill="currentColor" />
    </svg>
  );
}
