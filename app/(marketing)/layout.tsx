import { MarketingHeader } from "@/features/marketing/components/marketing-header";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-x-hidden bg-nd-cream">
      <div className="marketing-bg fixed inset-0 -z-20" aria-hidden="true" />
      <div
        className="marketing-bg-mesh pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
      />

      <MarketingHeader />
      {children}
    </div>
  );
}
