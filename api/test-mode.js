import { createClient } from "@supabase/supabase-js";

function testModeEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_TEST_MODE === "true" && process.env.NODE_ENV !== "production";
}

function verifyPin(body) {
  const pin = (body && body.pin) || "";
  const expected = process.env.TEST_MODE_PIN || "";
  return !!expected && pin === expected;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!testModeEnabled()) return res.status(404).json({ error: "Not found" });
  const body = req.body || {};
  if (!verifyPin(body)) return res.status(401).json({ error: "Unauthorized" });

  const action = body.action;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (action === "approve-customer") {
      const id = body.customerId;
      if (id) {
        const { error } = await supabase.from("test_demo_customers").update({ approved: true }).eq("id", id).eq("test_flag", true);
        if (error) throw error;
      } else {
        const { data: rows } = await supabase.from("test_demo_customers").select("id").eq("test_flag", true).eq("approved", false).limit(1);
        if (rows?.length) {
          const { error } = await supabase.from("test_demo_customers").update({ approved: true }).eq("id", rows[0].id);
          if (error) throw error;
        }
      }
      return res.status(200).json({ ok: true });
    }
    if (action === "meet-greet-complete") {
      const id = body.customerId;
      if (id) {
        const { error } = await supabase.from("test_demo_customers").update({ meet_and_greet_completed: true }).eq("id", id).eq("test_flag", true);
        if (error) throw error;
      } else {
        const { data: rows } = await supabase.from("test_demo_customers").select("id").eq("test_flag", true).limit(1);
        if (rows?.length) {
          const { error } = await supabase.from("test_demo_customers").update({ meet_and_greet_completed: true }).eq("id", rows[0].id);
          if (error) throw error;
        }
      }
      return res.status(200).json({ ok: true });
    }
    if (action === "create-booking") {
      const { data: customers } = await supabase.from("test_demo_customers").select("id").eq("test_flag", true).limit(1);
      const { data: walkers } = await supabase.from("test_demo_walkers").select("id").eq("test_flag", true).limit(1);
      if (!customers?.length || !walkers?.length) return res.status(400).json({ error: "Seed demo data first" });
      const scheduled_at = new Date(Date.now() + 86400000).toISOString();
      const { data: booking, error: e1 } = await supabase.from("test_demo_bookings").insert({ customer_id: customers[0].id, walker_id: walkers[0].id, status: "scheduled", scheduled_at, test_flag: true }).select("id").single();
      if (e1) throw e1;
      await supabase.from("test_demo_walks").insert({ booking_id: booking.id, status: "pending", test_flag: true });
      await supabase.from("test_demo_payments").insert({ booking_id: booking.id, status: "pending", test_flag: true });
      return res.status(200).json({ ok: true, bookingId: booking.id });
    }
    if (action === "assign-walker") {
      let { bookingId, walkerId } = body;
      if (!walkerId) {
        const { data: w } = await supabase.from("test_demo_walkers").select("id").eq("test_flag", true).limit(1);
        walkerId = w?.[0]?.id;
      }
      if (!bookingId) {
        const { data: b } = await supabase.from("test_demo_bookings").select("id").eq("test_flag", true).limit(1);
        bookingId = b?.[0]?.id;
      }
      if (bookingId && walkerId) {
        const { error } = await supabase.from("test_demo_bookings").update({ walker_id: walkerId }).eq("id", bookingId).eq("test_flag", true);
        if (error) throw error;
      }
      return res.status(200).json({ ok: true });
    }
    if (action === "start-walk") {
      let walkId = body.walkId;
      if (!walkId) {
        const { data: w } = await supabase.from("test_demo_walks").select("id").eq("test_flag", true).limit(1);
        walkId = w?.[0]?.id;
      }
      if (walkId) {
        const { error } = await supabase.from("test_demo_walks").update({ status: "in_progress" }).eq("id", walkId).eq("test_flag", true);
        if (error) throw error;
      }
      return res.status(200).json({ ok: true });
    }
    if (action === "complete-walk") {
      let walkId = body.walkId;
      if (!walkId) {
        const { data: w } = await supabase.from("test_demo_walks").select("id").eq("test_flag", true).limit(1);
        walkId = w?.[0]?.id;
      }
      if (walkId) {
        const { error } = await supabase.from("test_demo_walks").update({ status: "completed" }).eq("id", walkId).eq("test_flag", true);
        if (error) throw error;
      }
      return res.status(200).json({ ok: true });
    }
    if (action === "generate-report") {
      let walkId = body.walkId;
      if (!walkId) {
        const { data: w } = await supabase.from("test_demo_walks").select("id").eq("test_flag", true).limit(1);
        walkId = w?.[0]?.id;
      }
      if (walkId) {
        const { error } = await supabase.from("test_demo_reports").insert({ walk_id: walkId, content: { note: "Test report", gps: [], photos: [] }, test_flag: true });
        if (error) throw error;
      }
      return res.status(200).json({ ok: true });
    }
    if (action === "mark-paid") {
      const paymentId = body.paymentId;
      let bookingId = body.bookingId;
      if (!paymentId && !bookingId) {
        const { data: p } = await supabase.from("test_demo_payments").select("id, booking_id").eq("test_flag", true).limit(1);
        if (p?.[0]) bookingId = p[0].booking_id;
      }
      if (paymentId) {
        const { error } = await supabase.from("test_demo_payments").update({ status: "paid" }).eq("id", paymentId).eq("test_flag", true);
        if (error) throw error;
      } else if (bookingId) {
        const { error } = await supabase.from("test_demo_payments").update({ status: "paid" }).eq("booking_id", bookingId).eq("test_flag", true);
        if (error) throw error;
      }
      return res.status(200).json({ ok: true });
    }
    if (action === "seed") {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      let ownerId = body.ownerId;
      if (!ownerId && authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const authClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
        const { data: { user } } = await authClient.auth.getUser(token);
        if (user) ownerId = user.id;
      }
      const ownerIdOrNull = ownerId && ownerId !== "00000000-0000-0000-0000-000000000000" ? ownerId : null;

      const { data: w } = await supabase.from("test_demo_walkers").insert({ owner_id: ownerIdOrNull, name: "Test Walker", test_flag: true }).select("id").single();
      if (w?.id) {
        const { data: c1 } = await supabase.from("test_demo_customers").insert({ owner_id: ownerIdOrNull, email: "pending@test.demo", name: "Pending MG", approved: false, meet_and_greet_completed: false, test_flag: true }).select("id").single();
        const { data: c2 } = await supabase.from("test_demo_customers").insert({ owner_id: ownerIdOrNull, email: "approved@test.demo", name: "Approved Customer", approved: true, meet_and_greet_completed: true, test_flag: true }).select("id").single();
        let dogId = null;
        if (c2?.id) {
          const { data: d } = await supabase.from("test_demo_dogs").insert({ customer_id: c2.id, name: "Demo Dog", test_flag: true }).select("id").single();
          dogId = d?.id;
        }
        const scheduled_at = new Date(Date.now() + 86400000).toISOString();
        const { data: bk } = await supabase.from("test_demo_bookings").insert({ customer_id: c2?.id || c1?.id, walker_id: w.id, status: "scheduled", scheduled_at, test_flag: true }).select("id").single();
        if (bk?.id) {
          const { data: wk } = await supabase.from("test_demo_walks").insert({ booking_id: bk.id, status: "completed", test_flag: true }).select("id").single();
          if (wk?.id) {
            await supabase.from("test_demo_reports").insert({ walk_id: wk.id, content: { note: "Demo report", gps: [], photos: [] }, test_flag: true });
          }
          await supabase.from("test_demo_payments").insert({ booking_id: bk.id, status: "paid", test_flag: true });
        }
      }
      return res.status(200).json({ ok: true });
    }
    if (action === "reset") {
      await supabase.from("test_demo_reports").delete().eq("test_flag", true);
      await supabase.from("test_demo_payments").delete().eq("test_flag", true);
      await supabase.from("test_demo_walks").delete().eq("test_flag", true);
      await supabase.from("test_demo_bookings").delete().eq("test_flag", true);
      await supabase.from("test_demo_dogs").delete().eq("test_flag", true);
      await supabase.from("test_demo_customers").delete().eq("test_flag", true);
      await supabase.from("test_demo_walkers").delete().eq("test_flag", true);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    console.error("test-mode", e);
    return res.status(500).json({ error: e.message || "Failed" });
  }
}
