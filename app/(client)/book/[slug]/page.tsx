import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { OperatorBookingPage } from "@/features/booking/components/OperatorBookingPage";
import { resolveOperatorBySlug } from "@/features/booking/lib/operator-resolve";

type BookOperatorPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BookOperatorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const operator = await resolveOperatorBySlug(slug);

  if (!operator) {
    return {
      title: "Book a Walk — NeighborDogs",
      description: "Schedule a dog walk or set up a weekly package.",
    };
  }

  const businessName = operator.fullName || "NeighborDogs operator";

  return {
    title: `Book a Walk — ${businessName}`,
    description: `Schedule a dog walk with ${businessName}.`,
  };
}

export default async function BookOperatorPage({ params }: BookOperatorPageProps) {
  const { slug } = await params;
  const operator = await resolveOperatorBySlug(slug);

  if (!operator) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="client-booking legacy-admin"><p className="muted">Loading…</p></div>}>
      <OperatorBookingPage operator={operator} />
    </Suspense>
  );
}
