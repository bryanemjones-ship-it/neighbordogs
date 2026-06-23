export function PawBullet({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 text-nd-golden-deep ${className}`}
    >
      <path
        fill="currentColor"
        d="M12 15c-2 0-3.5 1.2-3.5 2.5S10 20 12 20s3.5-1.2 3.5-2.5S14 15 12 15zm-4.5-2.5c1 0 1.8-.8 1.8-1.8S8.5 9 7.5 9 5.7 9.8 5.7 10.8 6.5 12.5 7.5 12.5zm9 0c1 0 1.8-.8 1.8-1.8S17.5 9 16.5 9s-1.8.8-1.8 1.8.8 1.7 1.8 1.7zM9 9.2c.7 0 1.3-.6 1.3-1.3S9.7 6.6 9 6.6 7.7 7.2 7.7 7.9 8.3 9.2 9 9.2zm6 0c.7 0 1.3-.6 1.3-1.3S15.7 6.6 15 6.6s-1.3.6-1.3 1.3.6 1.3 1.3 1.3z"
      />
    </svg>
  );
}

export function DogTagIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 40"
      aria-hidden="true"
      className={`h-8 w-6 ${className}`}
    >
      <path
        d="M16 2 L28 8 V26 C28 30 22 34 16 38 C10 34 4 30 4 26 V8 Z"
        fill="currentColor"
        className="text-nd-golden"
      />
      <circle cx="16" cy="14" r="3" fill="#FFFDF7" opacity="0.9" />
      <path
        d="M13 20 Q16 23 19 20"
        stroke="#C9923F"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeroMascotSpot() {
  return (
    <div
      className="relative mx-auto flex aspect-square w-full max-w-[280px] items-center justify-center sm:max-w-none"
      aria-hidden="true"
    >
      <div className="absolute inset-4 rounded-full bg-nd-sky/40" />
      <div className="nd-glass-warm relative flex h-[88%] w-[88%] flex-col items-center justify-center rounded-nd-lg border-nd-border">
        <svg viewBox="0 0 160 160" className="h-36 w-36 sm:h-44 sm:w-44">
          <circle cx="80" cy="88" r="46" fill="#E9A84A" />
          <ellipse cx="52" cy="52" rx="18" ry="22" fill="#FFD6B0" />
          <ellipse cx="108" cy="52" rx="18" ry="22" fill="#FFD6B0" />
          <circle cx="66" cy="82" r="7" fill="#2E2722" />
          <circle cx="94" cy="82" r="7" fill="#2E2722" />
          <circle cx="68" cy="80" r="2.5" fill="#FFFDF7" />
          <circle cx="96" cy="80" r="2.5" fill="#FFFDF7" />
          <ellipse cx="80" cy="96" rx="10" ry="7" fill="#C9923F" opacity="0.45" />
          <path
            d="M44 108 Q80 128 116 108"
            stroke="#C9923F"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M34 112 Q80 138 126 112"
            fill="none"
            stroke="url(#collar)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="collar" x1="34" y1="112" x2="126" y2="112">
              <stop stopColor="#5C8FD6" />
              <stop offset="1" stopColor="#C7B7F3" />
            </linearGradient>
          </defs>
          <path
            d="M80 122 L84 132 L80 138 L76 132 Z"
            fill="#E9A84A"
            stroke="#C9923F"
            strokeWidth="1"
          />
          <path
            d="M78 128 C78 126 82 126 82 128 C82 130 78 130 78 128"
            fill="#F28B82"
          />
          <text x="118" y="36" fontSize="14" fill="#F28B82">
            ♥
          </text>
          <text x="28" y="48" fontSize="12" fill="#E9A84A">
            ✦
          </text>
          <text x="124" y="68" fontSize="10" fill="#5C8FD6">
            ✦
          </text>
        </svg>
        <p className="mt-1 text-xs font-medium text-nd-text-soft">
          Your first route. Your regulars.
        </p>
        <div className="nd-route-line absolute bottom-6 left-8 right-8 h-1 rounded-full opacity-40" />
      </div>
    </div>
  );
}

export function RouteMapMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 120"
      aria-hidden="true"
      className={`w-full max-w-xs text-nd-border ${className}`}
    >
      <rect
        x="8"
        y="8"
        width="184"
        height="104"
        rx="12"
        fill="#FFFDF7"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M36 84 C 60 60, 80 72, 100 48 S 140 36, 164 56"
        fill="none"
        stroke="#E9A84A"
        strokeWidth="2.5"
        strokeDasharray="4 6"
        strokeLinecap="round"
      />
      <circle cx="36" cy="84" r="5" fill="#4FA76B" />
      <circle cx="100" cy="48" r="4" fill="#E9A84A" />
      <circle cx="164" cy="56" r="5" fill="#5C8FD6" />
      <PawMini x={92} y={40} />
    </svg>
  );
}

/** Playful route for final CTA — no gray box. */
export function FinalRouteMap({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 80"
      aria-hidden="true"
      className={className}
    >
      <circle cx="40" cy="40" r="10" fill="#4FA76B" />
      <circle cx="40" cy="40" r="4" fill="#FFFDF7" />
      <path
        d="M52 40 C 90 40, 110 22, 150 28 S 210 52, 260 38"
        fill="none"
        stroke="#E9A84A"
        strokeWidth="3"
        strokeDasharray="6 8"
        strokeLinecap="round"
      />
      <g transform="translate(148, 18)">
        <path
          d="M12 2 L22 6 V18 C22 21 17 24 12 28 C7 24 2 21 2 18 V6 Z"
          fill="#E9A84A"
        />
        <PawMini x={4} y={6} />
      </g>
      <circle cx="280" cy="38" r="10" fill="#5C8FD6" />
      <circle cx="280" cy="38" r="4" fill="#FFFDF7" />
    </svg>
  );
}

function PawMini({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(0.35)`} fill="#E9A84A" opacity="0.6">
      <circle cx="12" cy="18" r="4" />
      <circle cx="4" cy="8" r="3" />
      <circle cx="20" cy="8" r="3" />
      <circle cx="7" cy="4" r="2.5" />
      <circle cx="17" cy="4" r="2.5" />
    </g>
  );
}
