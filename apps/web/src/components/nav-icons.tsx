import type { ReactElement, SVGProps } from 'react';

/**
 * The approved Zenith icon language ("Faceted") -- Design Freeze at
 * commit 5b2f135, now the single shared icon set for every screen's nav
 * (Visual Propagation phase), not just the Dashboard. Zenith's own
 * constructed system, not a reskinned Heroicons/Lucide/Material set.
 *
 * The rule every glyph follows: one corner of the icon's primary shape
 * is cut at a flat facet rather than rounded, and the active/accent
 * state adds a small filled convergence dot -- the same two moves that
 * define the brand mark and the panel/card corner treatment. Seeing
 * any one of these three (icon, mark, or a cut card corner) alone
 * should be enough to recognize the other two.
 */

type IconProps = SVGProps<SVGSVGElement> & { active?: boolean };

function shell(props: IconProps) {
  const { active, ...rest } = props;
  void active; // consumed only to keep it out of the spread onto <svg>
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: rest.strokeWidth ?? 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  };
}

function Dot({ active }: { active?: boolean }) {
  if (!active) return null;
  return <circle cx="19" cy="5" r="1.6" fill="currentColor" stroke="none" />;
}

export function IconDashboard(props: IconProps) {
  return (
    <svg {...shell(props)}>
      {/* four panes, top-right pane facet-cut */}
      <path d="M3 3h7v7H3z" />
      <path d="M14 3h4l3 3v4h-7z" />
      <path d="M14 12h7v9h-7z" />
      <path d="M3 12h7v9H3z" />
      <Dot active={props.active} />
    </svg>
  );
}

export function IconBrief(props: IconProps) {
  return (
    <svg {...shell(props)}>
      {/* sunrise disc, facet-cut upper-right */}
      <path d="M12 3v2.1M4.2 5.2l1.5 1.5M3 12h2.1M4.2 18.8l1.5-1.5M12 20.9V19M18.3 18.8l-1.5-1.5M21 12h-2.1" />
      <path d="M7.2 12a4.8 4.8 0 0 1 9.4-1.4L14 12z" />
      <Dot active={props.active} />
    </svg>
  );
}

export function IconWatchlist(props: IconProps) {
  return (
    <svg {...shell(props)}>
      {/* eye, outer lid facet-cut at the right corner */}
      <path d="M2 12c1.6-3.4 5-6.2 8.6-6.8L21 12l-4.4 4.7c-3.9 1-8.6-1-14.6-4.7Z" />
      <circle cx="11.5" cy="12" r="2.6" />
      <Dot active={props.active} />
    </svg>
  );
}

export function IconPortfolio(props: IconProps) {
  return (
    <svg {...shell(props)}>
      {/* case body facet-cut top-right */}
      <path d="M3 8.5h14L21 12v7.5H3z" />
      <path d="M8 8.5V6a2 2 0 0 1 2-2h4v4.5" />
      <path d="M3 13.5h18" />
      <Dot active={props.active} />
    </svg>
  );
}

export function IconAlerts(props: IconProps) {
  return (
    <svg {...shell(props)}>
      {/* bell shell, top-right facet-cut into the strike point */}
      <path d="M6.2 15.5c0-3.8.3-8.5 5.8-8.5s5.8 4.7 5.8 8.5L20 17.5H4Z" />
      <path d="M17.8 7 20 4.8" />
      <path d="M9.7 19.8a2.3 2.3 0 0 0 4.6 0" />
      <Dot active={props.active} />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...shell(props)}>
      {/* grid, top-right corner facet-cut */}
      <path d="M3 6h14.5L21 9.5V20H3Z" />
      <path d="M3 10.5h18M8 3v4.5" />
      <Dot active={props.active} />
    </svg>
  );
}

export function IconCot(props: IconProps) {
  return (
    <svg {...shell(props)}>
      {/* three bars, tallest bar facet-cut top */}
      <path d="M4 20V11" />
      <path d="M11.5 20V7l3-2.5V20z" />
      <path d="M18.5 20v-9" />
      <Dot active={props.active} />
    </svg>
  );
}

export function IconReports(props: IconProps) {
  return (
    <svg {...shell(props)}>
      {/* page, dog-ear corner IS the facet cut (doubles as the fold) */}
      <path d="M6 3h8.5L19 7.5V21H6Z" />
      <path d="M14.5 3v4.5H19" />
      <path d="M9 12.5h6M9 16.5h6" />
      <Dot active={props.active} />
    </svg>
  );
}

export function IconAiWorkspace(props: IconProps) {
  return (
    <svg {...shell(props)}>
      {/* spark, one ray replaced by a facet-cut corner accent */}
      <path d="M12 2.5 13.6 9l6.4 1.6-6.4 1.7L12 19l-1.6-6.7L4 10.6 10.4 9Z" />
      <Dot active={props.active} />
    </svg>
  );
}

export function IconJournal(props: IconProps) {
  return (
    <svg {...shell(props)}>
      {/* bound notebook, spine + top-right facet-cut cover */}
      <path d="M5.5 4h11.5L20 6.5V20H8a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M5.5 4v13.5A2.5 2.5 0 0 0 8 20" />
      <Dot active={props.active} />
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
