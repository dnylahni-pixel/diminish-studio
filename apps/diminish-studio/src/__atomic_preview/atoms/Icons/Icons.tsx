/**
 * ATOMS: Icons - نسخه دقیق فایل اتمیک تک‌فایل (24 viewBox / 18px)
 */
type IconProps = { active?: boolean; size?: number };

export const IconHome = ({ active, size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    {active ? (
      <path d="M12 3L3.5 9.5V20.5C3.5 21.0523 3.94772 21.5 4.5 21.5H9.5V14.5C9.5 13.3954 10.3954 12.5 11.5 12.5H12.5C13.6046 12.5 14.5 13.3954 14.5 14.5V21.5H19.5C20.0523 21.5 20.5 21.0523 20.5 20.5V9.5L12 3Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    ) : (
      <path d="M3.5 9.8L12 3.5L20.5 9.8V20.5C20.5 21.0523 20.0523 21.5 19.5 21.5H14.5V14.7C14.5 13.5674 13.5826 12.65 12.45 12.65H11.55C10.4174 12.65 9.5 13.5674 9.5 14.7V21.5H4.5C3.94772 21.5 3.5 21.0523 3.5 20.5V9.8Z" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

export const IconExplore = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <circle cx="11.2" cy="11.2" r="5.8" stroke="currentColor" strokeWidth="1.45" />
    <path d="M15.8 15.8L20.5 20.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
  </svg>
);

export const IconFeed = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <rect x="3.2" y="3.2" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.45" />
    <rect x="13.8" y="3.2" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.45" />
    <rect x="3.2" y="13.8" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.45" />
    <rect x="13.8" y="13.8" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.45" />
  </svg>
);

export const IconUpload = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M12 16.5V4.5M12 4.5L8 8.5M12 4.5L16 8.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 15.5V19.5C3.5 20.0523 3.94772 20.5 4.5 20.5H19.5C20.0523 20.5 20.5 20.0523 20.5 19.5V15.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
  </svg>
);

export const IconLibrary = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M5.5 4.5C5.5 3.94772 5.94772 3.5 6.5 3.5H14.5C15.6046 3.5 16.5 4.39543 16.5 5.5V20.5C16.5 21.0523 16.0523 21.5 15.5 21.5H6.5C5.94772 21.5 5.5 21.0523 5.5 20.5V4.5Z" stroke="currentColor" strokeWidth="1.45" />
    <path d="M8.5 8.5H13.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.9" />
    <path d="M16.5 5.5H18.5C19.0523 5.5 19.5 5.94772 19.5 6.5V19.5C19.5 20.0523 19.0523 20.5 18.5 20.5H16.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
  </svg>
);

export const IconSettings = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.45" />
    <path d="M12 3.5V5.2M12 18.8V20.5M4.9 4.9L6.1 6.1M17.9 17.9L19.1 19.1M3.5 12H5.2M18.8 12H20.5M4.9 19.1L6.1 17.9M17.9 6.1L19.1 4.9M8.2 4.3L8.8 6M15.2 18L15.8 19.7M18 8.2L16.3 8.8M6 15.2L4.3 15.8M8.2 19.7L8.8 18M15.2 6L15.8 4.3M6 8.8L4.3 8.2M18 15.8L16.3 15.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const IconSupport = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.45" />
    <path d="M9.2 9.6C9.2 8.1 10.5 7 12.2 7C13.9 7 15.1 8.1 15.1 9.6C15.1 11.1 13.8 11.8 12.9 12.4C12.2 12.9 12 13.4 12 14.2" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    <circle cx="12" cy="17.2" r="1" fill="currentColor" />
  </svg>
);

export const IconSun = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 2V4M12 20V22M4 12H2M22 12H20M5.1 5.1L6.5 6.5M17.5 17.5L18.9 18.9M18.9 5.1L17.5 6.5M6.5 17.5L5.1 18.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const IconMoon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M19.5 12.8C19.5 16.9 16.1 20.2 12 20.2C7.9 20.2 4.5 16.9 4.5 12.8C4.5 8.7 7.9 5.3 12 5.3C12.6 5.3 13.1 5.4 13.7 5.5C12.2 6.6 11.2 8.4 11.2 10.5C11.2 13.5 13.6 15.9 16.6 15.9C17.3 15.9 17.9 15.8 18.5 15.6C19 14.5 19.5 13.2 19.5 12.8Z" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round" />
  </svg>
);

export const IconClose = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const IconChevron = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconHamburger = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const ICON_MAP = {
  Home: IconHome,
  Explore: IconExplore,
  Feed: IconFeed,
  Upload: IconUpload,
  Library: IconLibrary,
  Settings: IconSettings,
  Support: IconSupport,
} as const;