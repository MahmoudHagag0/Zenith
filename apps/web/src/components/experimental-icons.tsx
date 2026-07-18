/**
 * Shared minimal icon set for the three experimental visual-identity
 * routes (`/dashboard-a`, `/dashboard-b`, `/dashboard-c`). One glyph
 * per locked nav item -- restyled (size/stroke-weight/color/fill) per
 * direction via each route's own CSS, not duplicated three times.
 * Not used by the production Dashboard or `@zenith/ui` -- purely for
 * this exploration, deleted along with the losing directions once the
 * founders choose.
 */
import type { ReactElement, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { filled?: boolean };

function base(props: IconProps) {
  const { filled, ...rest } = props;
  return {
    viewBox: '0 0 24 24',
    fill: filled ? 'currentColor' : 'none',
    stroke: 'currentColor',
    strokeWidth: rest.strokeWidth ?? 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  };
}

export function IconDashboard(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

export function IconBrief(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3v2.2M12 18.8V21M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M3 12h2.2M18.8 12H21M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
    </svg>
  );
}

export function IconWatchlist(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconPortfolio(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="8" width="18" height="12" rx="1.5" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

export function IconAlerts(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconCot(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20V10M11 20V4M18 20v-7" />
    </svg>
  );
}

export function IconReports(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3h9l4 4v14H6Z" />
      <path d="M15 3v4h4M9 12h6M9 16h6" />
    </svg>
  );
}

export function IconAiWorkspace(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M7 7l2.2 2.2M17 17l-2.2-2.2M17 7l-2.2 2.2M7 17l2.2-2.2" />
    </svg>
  );
}

export function IconJournal(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2Z" />
      <path d="M5 18a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

export const NAV_ICON_BY_HREF: Record<string, (props: IconProps) => ReactElement> = {
  '/': IconDashboard,
  '/morning-brief': IconBrief,
  '/watchlist': IconWatchlist,
  '/portfolio': IconPortfolio,
  '/alerts': IconAlerts,
  '/calendar-news': IconCalendar,
  '/cot': IconCot,
  '/reports': IconReports,
  '/ai-workspace': IconAiWorkspace,
  '/journal': IconJournal,
};
