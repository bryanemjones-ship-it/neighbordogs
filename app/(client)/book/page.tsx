import type { Metadata } from "next";
import { ClientBookingFlow } from "@/features/booking/components/ClientBookingFlow";

export const metadata: Metadata = {
  title: "Book a Walk — NeighborDogs",
  description: "Schedule a dog walk or set up a weekly package.",
};

export default function BookPage() {
  return <ClientBookingFlow />;
}
