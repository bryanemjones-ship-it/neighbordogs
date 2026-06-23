import Link from "next/link";

type TerritoryCtaProps = {
  className?: string;
  variant?: "grass" | "collar";
};

export function TerritoryCta({
  className = "",
  variant = "grass",
}: TerritoryCtaProps) {
  const colors =
    variant === "collar"
      ? "bg-nd-collar hover:bg-[#4f7fc4] shadow-[0_3px_12px_rgba(92,143,214,0.22)]"
      : "bg-nd-grass hover:bg-nd-grass-dark shadow-[0_3px_12px_rgba(79,167,107,0.22)]";

  return (
    <Link
      href="/territory-preview"
      className={`inline-flex h-12 items-center justify-center rounded-full px-7 text-sm font-semibold text-white transition ${colors} ${className}`}
    >
      Check my territory
    </Link>
  );
}
