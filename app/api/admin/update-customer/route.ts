import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/shared/lib/supabase";

const TABLE = "test_demo_customers";

type CustomerUpdatePayload = {
  email?: string;
  name?: string;
  phone?: string;
  dogs?: string;
  address?: string;
  notes?: string;
  accessNotes?: string;
  adminNotes?: string;
  approved?: boolean;
};

type BatchCustomerPayload = {
  email: string;
  approved: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildRow(payload: CustomerUpdatePayload): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  if (typeof payload.name === "string") {
    row.name = payload.name.trim();
  }
  if (typeof payload.approved === "boolean") {
    row.approved = payload.approved;
  }

  return row;
}

async function findCustomerIdByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const { data, error } = await supabase
    .from(TABLE)
    .select("id")
    .eq("test_flag", true)
    .ilike("email", normalized)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

async function upsertCustomer(
  supabase: SupabaseClient,
  email: string,
  row: Record<string, unknown>,
): Promise<void> {
  const normalized = normalizeEmail(email);
  const existingId = await findCustomerIdByEmail(supabase, normalized);

  if (existingId) {
    const { error } = await supabase
      .from(TABLE)
      .update(row)
      .eq("id", existingId)
      .eq("test_flag", true);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from(TABLE).insert({
    email: normalized,
    name: typeof row.name === "string" ? row.name : null,
    approved: typeof row.approved === "boolean" ? row.approved : false,
    meet_and_greet_completed: false,
    test_flag: true,
  });

  if (error) throw error;
}

async function updateApprovalOnly(
  supabase: SupabaseClient,
  email: string,
  approved: boolean,
): Promise<void> {
  await upsertCustomer(supabase, email, { approved });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customers?: BatchCustomerPayload[];
    } & CustomerUpdatePayload;

    const supabase = createSupabaseServerClient();

    if (Array.isArray(body.customers)) {
      if (!body.customers.length) {
        return NextResponse.json(
          { error: "customers array is empty" },
          { status: 400 },
        );
      }

      for (const entry of body.customers) {
        if (typeof entry?.email !== "string" || !entry.email.trim()) {
          return NextResponse.json(
            { error: "Each customer entry requires a valid email" },
            { status: 400 },
          );
        }
        if (typeof entry.approved !== "boolean") {
          return NextResponse.json(
            { error: "Each customer entry requires an approved boolean" },
            { status: 400 },
          );
        }

        await updateApprovalOnly(supabase, entry.email, entry.approved);
      }

      return NextResponse.json({
        ok: true,
        updated: body.customers.length,
      });
    }

    if (typeof body.email !== "string" || !body.email.trim()) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const row = buildRow(body);
    if (!Object.keys(row).length) {
      return NextResponse.json(
        { error: "No updatable fields provided" },
        { status: 400 },
      );
    }

    await upsertCustomer(supabase, body.email, row);

    return NextResponse.json({ ok: true, email: normalizeEmail(body.email) });
  } catch (error) {
    console.error("[admin/update-customer] error", error);

    const message =
      error instanceof Error ? error.message : "Customer update failed";

    if (message === "Supabase is not configured") {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
