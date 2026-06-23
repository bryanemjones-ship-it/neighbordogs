import "@/features/booking/components/client-booking.css";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="client-booking-bg flex min-h-full flex-1 flex-col">
      <header>
        <div className="wrap">
          <h1>NeighborDogs — Book a Walk</h1>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
