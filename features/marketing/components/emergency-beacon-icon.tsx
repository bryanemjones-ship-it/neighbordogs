export function EmergencyBeaconIcon({ className = "" }: { className?: string }) {
  return (
    <span
      className={`nd-beacon-pulse relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-nd-coral/45 bg-nd-coral/15 ${className}`}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-full bg-nd-coral/25 nd-beacon-ring" />
      <span
        className="relative flex h-full w-full items-center justify-center text-base leading-none"
        role="img"
        aria-label="Emergency siren"
      >
        🚨
      </span>
    </span>
  );
}
