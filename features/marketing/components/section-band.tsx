import { PawBullet } from "./icons";

type SectionBandProps = {
  children: React.ReactNode;
  id?: string;
  tone?: "plain" | "sky" | "butter" | "mint" | "cream";
  className?: string;
  divider?: boolean;
};

const toneClasses = {
  plain: "",
  sky: "bg-nd-sky/40",
  butter: "bg-nd-butter/30",
  mint: "bg-nd-mint/35",
  cream: "bg-nd-card-cream/80",
};

export function SectionBand({
  children,
  id,
  tone = "plain",
  className = "",
  divider = false,
}: SectionBandProps) {
  if (tone === "plain" && !divider) {
    return (
      <section id={id} className={className}>
        {children}
      </section>
    );
  }

  return (
    <section id={id} className={`relative ${className}`}>
      {divider ? (
        <div className="nd-route-divider mx-auto mb-10 max-w-md opacity-60" aria-hidden />
      ) : null}
      <div
        className={`relative left-1/2 -ml-[50vw] w-screen ${toneClasses[tone]} py-10 sm:py-12`}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-6">{children}</div>
      </div>
    </section>
  );
}

export function RouteDivider() {
  return (
    <div className="my-12 flex items-center justify-center gap-2 opacity-70" aria-hidden>
      <PawBullet className="text-nd-golden" />
      <div className="nd-route-divider h-px w-32" />
      <PawBullet className="text-nd-golden" />
    </div>
  );
}
