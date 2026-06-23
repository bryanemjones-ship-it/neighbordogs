import Link from "next/link";
import { PawBullet } from "./icons";

const navLinks = [
  { href: "#operator-demo", label: "Demo" },
  { href: "#client-demo", label: "Features" },
  { href: "#math", label: "Math" },
  { href: "#faq", label: "FAQ" },
  { href: "#pricing", label: "Pricing" },
];

export function MarketingHeader() {
  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-lg font-semibold tracking-tight text-nd-text"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-nd-golden"
            aria-hidden="true"
          >
            <PawBullet className="h-4 w-4 text-white" />
          </span>
          NeighborDogs
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-nd-text-soft transition hover:text-nd-text sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-xs font-medium text-nd-text-soft underline-offset-4 transition hover:text-nd-text hover:underline sm:text-sm"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
