import type { DemoIdentity } from "@/features/marketing/lib/demo-identity";
import { TerritoryCta } from "@/features/territory/components/territory-cta";
import { FinalRouteMap } from "./icons";

type FinalCTAProps = {
  demoIdentity: DemoIdentity;
};

export function FinalCTA({ demoIdentity }: FinalCTAProps) {
  const { demoBusinessName } = demoIdentity;

  return (
    <section className="relative mt-14 overflow-hidden py-10 text-center sm:py-12">
      <div className="relative left-1/2 -ml-[50vw] w-screen bg-nd-sky/45 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <FinalRouteMap className="mx-auto mb-6 h-24 w-full max-w-sm" />
          <h2 className="text-3xl font-bold tracking-tight text-nd-text sm:text-4xl">
            Find your route.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-nd-text-soft">
            Type your name. Enter an address. See if your neighborhood is open.
          </p>
          {demoBusinessName ? (
            <p className="mt-2 text-sm font-medium text-nd-golden-deep">
              {demoBusinessName}
            </p>
          ) : null}
          <div className="mt-8 flex justify-center">
            <TerritoryCta variant="collar" />
          </div>
        </div>
      </div>
    </section>
  );
}
