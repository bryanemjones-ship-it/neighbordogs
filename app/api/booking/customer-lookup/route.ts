import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("customers")
      .select("id, email, name, approved")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      console.error("[booking/customer-lookup] error", error);
      return NextResponse.json(
        { error: "Could not look up customer." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ ok: false, found: false });
    }

    return NextResponse.json({
      ok: true,
      customer: {
        id: data.id,
        email: data.email,
        name: data.name,
        approved: data.approved,
      },
    });
  } catch (error) {
    console.error("[booking/customer-lookup] error", error);
    const message =
      error instanceof Error ? error.message : "Could not look up customer.";

    if (message === "Supabase is not configured") {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
