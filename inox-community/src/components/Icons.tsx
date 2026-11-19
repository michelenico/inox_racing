type P = { size?: number };
const base = (size: number) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
});

export const IconHome = ({ size = 22 }: P) => <svg {...base(size)}><path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4Z" /></svg>;
export const IconForum = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M14 9a5 5 0 0 1-7.4 4.4L3 14l.7-3.2A5 5 0 1 1 14 9Z" /><path d="M10 17.5a5 5 0 0 0 7.4 1.9L21 20l-.7-3.2A5 5 0 0 0 16.6 9" /></svg>
);
export const IconPlus = ({ size = 26 }: P) => <svg {...base(size)} strokeWidth={2.6}><path d="M12 5v14M5 12h14" /></svg>;
export const IconTrophy = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" /></svg>
);
export const IconUser = ({ size = 22 }: P) => <svg {...base(size)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const IconSearch = ({ size = 20 }: P) => <svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const IconBell = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
);
export const IconSmile = ({ size = 20 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" /><path d="M9 9.5h.01M15 9.5h.01" /></svg>
);
export const IconBookmark = ({ size = 19 }: P) => <svg {...base(size)}><path d="M6 3h12v18l-6-4-6 4Z" /></svg>;
export const IconBack = ({ size = 20 }: P) => <svg {...base(size)} strokeWidth={2.2}><path d="m15 18-6-6 6-6" /></svg>;
export const IconPin = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const IconVerified = ({ size = 15 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Cliente verificato">
    <circle cx="12" cy="12" r="10" fill="var(--accent)" />
    <path d="m8 12 3 3 5-6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
