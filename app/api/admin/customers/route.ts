import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase";
import { CUSTOMERS_TABLE } from "@/features/booking/lib/db";
import type { LegacyCustomer } from "@/features/booking/lib/models";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from(CUSTOMERS_TABLE)
      .select("id, email, name, approved, created_at")
      .eq("test_flag", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/customers] GET error", error);
      return NextResponse.json(
        { error: error.message || "Could not load customers." },
        { status: 500 },
      );
    }

    const customers: LegacyCustomer[] = (data || []).map((row) => ({
      email: row.email,
      name: row.name || undefined,
      approved: row.approved,
      createdAt: row.created_at || undefined,
    }));

    return NextResponse.json({ ok: true, customers });
  } catch (error) {
    console.error("[admin/customers] GET error", error);
    const message =
      error instanceof Error ? error.message : "Could not load customers.";

    if (message === "Supabase is not configured") {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
