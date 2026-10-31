// Faint, slowly moving line drawings in the page margins: a network of
// connected nodes, a heartbeat trace, a small bar chart and a leaf, nods to the
// lab's research streams. Purely decorative: fixed behind the content, hidden
// from assistive tech, shown only where wide screens leave empty gutters, and
// still when the visitor prefers reduced motion (see .ra-amb-* in globals.css).

export function ResearchAmbient() {
  return (
    <div className="ra-amb" aria-hidden="true">
      <svg className="ra-amb-item ra-amb-network" viewBox="0 0 120 110" fill="none">
        <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <path d="M20 30 L58 18 L96 40 L74 84 L32 78 Z" opacity=".5" />
          <path d="M20 30 L74 84 M58 18 L32 78 M58 18 L74 84" opacity=".28" />
        </g>
        <circle className="ra-amb-node" cx="20" cy="30" r="4" fill="var(--primary)" />
        <circle className="ra-amb-node" cx="58" cy="18" r="5" fill="var(--accent)" />
        <circle className="ra-amb-node" cx="96" cy="40" r="4" fill="var(--primary)" />
        <circle className="ra-amb-node" cx="74" cy="84" r="4.5" fill="var(--accent)" />
        <circle className="ra-amb-node" cx="32" cy="78" r="3.5" fill="var(--primary)" />
      </svg>

      <svg className="ra-amb-item ra-amb-pulse" viewBox="0 0 160 48" fill="none">
        <path pathLength="1" d="M2 26 H46 L56 10 L68 42 L80 4 L92 34 L100 26 H158" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <svg className="ra-amb-item ra-amb-bars" viewBox="0 0 84 72" fill="none">
        <path d="M4 68 H80" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".5" />
        <rect className="ra-amb-bar" x="10" y="20" width="10" height="46" rx="2" fill="var(--primary)" />
        <rect className="ra-amb-bar" x="28" y="34" width="10" height="32" rx="2" fill="var(--accent)" />
        <rect className="ra-amb-bar" x="46" y="12" width="10" height="54" rx="2" fill="var(--primary)" />
        <rect className="ra-amb-bar" x="64" y="40" width="10" height="26" rx="2" fill="var(--accent)" />
      </svg>

      <svg className="ra-amb-item ra-amb-leaf" viewBox="0 0 64 64" fill="none">
        <path d="M12 52 C10 26 28 10 54 10 C54 36 38 54 12 52 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M12 52 C24 40 34 30 46 18" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  )
}
