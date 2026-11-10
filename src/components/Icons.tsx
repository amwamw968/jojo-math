import type { ReactNode } from "react";

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function Fox({ size = 40 }: { size?: number }) {
  return (
    <svg className="fox" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <polygon points="12,30 20,8 30,28" fill="#F4A259" />
      <polygon points="52,30 44,8 34,28" fill="#F4A259" />
      <polygon points="18,14 22,10 24,18" fill="#E07A2A" />
      <polygon points="46,14 42,10 40,18" fill="#E07A2A" />
      <ellipse cx="32" cy="38" rx="20" ry="16" fill="#F4A259" />
      <ellipse cx="32" cy="45" rx="11" ry="8" fill="#FFF6EA" />
      <circle cx="24" cy="36" r="2.3" fill="#2C2416" />
      <circle cx="40" cy="36" r="2.3" fill="#2C2416" />
      <ellipse cx="32" cy="43" rx="2.1" ry="1.6" fill="#2C2416" />
    </svg>
  );
}

export const HomeIcon = () => (
  <Svg>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10.5V20h12V10.5" />
  </Svg>
);

export const BookIcon = () => (
  <Svg>
    <path d="M5 5.5h6.5A2.5 2.5 0 0 1 14 8v11H7.2A2.2 2.2 0 0 0 5 21.2V5.5Z" />
    <path d="M19 5.5h-6.5A2.5 2.5 0 0 0 10 8v11h6.8A2.2 2.2 0 0 1 19 21.2V5.5Z" />
  </Svg>
);

export const PencilIcon = () => (
  <Svg>
    <path d="M13 5.5 18.5 11 8 21.5H3.5V17L13 5.5Z" />
    <path d="M11.5 7 17 12.5" />
  </Svg>
);

export const AlertIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v5" />
    <path d="M12 16.5h.01" />
  </Svg>
);

export const BulbIcon = () => (
  <Svg>
    <path d="M9 16.5h6" />
    <path d="M9.5 19h5" />
    <path d="M8.5 14a5 5 0 1 1 7 0c-.8.8-1.5 1.4-1.5 2.5h-4c0-1.1-.7-1.7-1.5-2.5Z" />
  </Svg>
);
