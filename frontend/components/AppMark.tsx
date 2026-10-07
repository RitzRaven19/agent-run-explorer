// The "hex agent" mark from app/icon.svg, inline so the header can show it. The gradient ids carry a prefix
// so they cannot clash with the ids of any other SVG on the page.
export default function AppMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="app-mark-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1c0f3a" />
          <stop offset="1" stopColor="#07030f" />
        </linearGradient>
        <linearGradient id="app-mark-stroke" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="1" stopColor="#e9d5ff" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#app-mark-bg)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="#a78bfa" strokeOpacity="0.4" />
      <path d="M16 5 L25.5 10.5 V21.5 L16 27 L6.5 21.5 V10.5 Z" stroke="url(#app-mark-stroke)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11.5 19.5 L16 13 L20.5 18" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11.5" cy="19.5" r="1.9" fill="#c4b5fd" />
      <circle cx="16" cy="13" r="1.9" fill="#ede9fe" />
      <circle cx="20.5" cy="18" r="2" fill="#f472b6" />
    </svg>
  );
}
