"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadCustomers,
  type LegacyCustomer,
} from "@/features/booking/lib/models";

type EditForm = {
  name: string;
  email: string;
  phone: string;
  dogs: string;
  address: string;
  notes: string;
  accessNotes: string;
  adminNotes: string;
  approved: boolean;
};

type ApprovalsPanelProps = {
  showToast: (title: string, message: string) => void;
};

function emptyEditForm(): EditForm {
  return {
    name: "",
    email: "",
    phone: "",
    dogs: "",
    address: "",
    notes: "",
    accessNotes: "",
    adminNotes: "",
    approved: false,
  };
}

async function syncCustomerToDb(customer: LegacyCustomer) {
  try {
    await fetch("/api/admin/update-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        dogs: customer.dogs,
        address: customer.address,
        notes: customer.notes,
        accessNotes: customer.accessNotes,
        adminNotes: customer.adminNotes,
        approved: customer.approved,
      }),
    });
  } catch (e) {
    console.error("❌ DB edit sync failed:", e);
  }
}

async function syncApprovalsBatch(
  batch: Array<{ email: string; approved: boolean }>,
) {
  try {
    await fetch("/api/admin/update-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customers: batch }),
    });
  } catch (e) {
    console.error("❌ DB approval sync failed:", e);
  }
}

export function ApprovalsPanel({ showToast }: ApprovalsPanelProps) {
  const [customers, setCustomers] = useState<LegacyCustomer[]>([]);
  const [approvalDraft, setApprovalDraft] = useState<boolean[]>([]);
  const [adminMsg, setAdminMsg] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm());
  const [ecMsg, setEcMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    idx: number;
    name: string;
  } | null>(null);

  const refreshCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customers");
      const data = (await res.json()) as {
        ok?: boolean;
        customers?: LegacyCustomer[];
        error?: string;
      };

      if (!res.ok || !data.ok) {
        console.error("[ApprovalsPanel] load failed:", data.error);
        setCustomers(loadCustomers());
        setApprovalDraft(loadCustomers().map((c) => !!c.approved));
        return;
      }

      const loaded = data.customers || [];
      setCustomers(loaded);
      setApprovalDraft(loaded.map((c) => !!c.approved));
    } catch (e) {
      console.error("[ApprovalsPanel] load failed:", e);
      const fallback = loadCustomers();
      setCustomers(fallback);
      setApprovalDraft(fallback.map((c) => !!c.approved));
    }
  }, []);

  useEffect(() => {
    void refreshCustomers();
  }, [refreshCustomers]);

  function handleApprovalToggle(idx: number, checked: boolean) {
    setApprovalDraft((prev) => {
      const next = [...prev];
      next[idx] = checked;
      return next;
    });
  }

  async function saveApprovals() {
    const nextCustomers = customers.map((customer, idx) => ({
      ...customer,
      approved: approvalDraft[idx] ?? customer.approved,
    }));
    const batch = nextCustomers
      .filter((c) => c.email)
      .map((c) => ({ email: c.email, approved: c.approved }));

    setCustomers(nextCustomers);
    setApprovalDraft(nextCustomers.map((c) => !!c.approved));
    await syncApprovalsBatch(batch);
    showToast("Saved", "Customer approvals updated.");
    setAdminMsg("");
  }

  function openEditCustomer(idx: number) {
    const c = customers[idx];
    if (!c) return;
    setEditIdx(idx);
    setEditForm({
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      dogs: c.dogs || "",
      address: c.address || c.geo?.formatted || "",
      notes: c.notes || "",
      accessNotes: c.accessNotes || "",
      adminNotes: c.adminNotes || "",
      approved: !!c.approved,
    });
    setEcMsg("");
    setEditOpen(true);
  }

  function closeEditModal() {
    setEditOpen(false);
    setEditIdx(null);
    setEditForm(emptyEditForm());
    setEcMsg("");
  }

  async function saveEditCustomer() {
    if (editIdx === null || !customers[editIdx]) return;
    const nextCustomers = [...customers];
    nextCustomers[editIdx] = {
      ...nextCustomers[editIdx],
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      dogs: editForm.dogs.trim(),
      address: editForm.address.trim(),
      notes: editForm.notes.trim(),
      accessNotes: editForm.accessNotes.trim(),
      adminNotes: editForm.adminNotes.trim(),
      approved: editForm.approved,
    };
    setCustomers(nextCustomers);
    setApprovalDraft(nextCustomers.map((c) => !!c.approved));
    await syncCustomerToDb(nextCustomers[editIdx]);
    showToast("Saved", "Customer details updated.");
    closeEditModal();
  }

  async function confirmDeleteCustomer() {
    if (!deleteConfirm) return;
    const nextCustomers = customers.filter((_, i) => i !== deleteConfirm.idx);
    setCustomers(nextCustomers);
    setApprovalDraft(nextCustomers.map((c) => !!c.approved));
    showToast("Deleted", `${deleteConfirm.name} has been removed.`);
    setDeleteConfirm(null);
    closeEditModal();
  }

  return (
    <>
      <div id="adminPanelApprovals" className="stack">
        <div id="adminList" className="stack">
          {!customers.length ? (
            <div className="muted">No customers yet.</div>
          ) : (
            customers.map((c, idx) => (
              <div key={`${c.email}-${idx}`} className="card">
                <div
                  className="row"
                  style={{
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div className="stack" style={{ gap: 6, flex: 1 }}>
                    <div>
                      <strong>{c.name || c.nickname}</strong>{" "}
                      {c.approved ? (
                        <span className="pill ok">Approved</span>
                      ) : (
                        <span className="pill warn">Pending</span>
                      )}
                    </div>
                    <div className="tiny">
                      {c.email || ""} · {c.phone || ""}
                    </div>
                    <div className="tiny">
                      {c.address || c.geo?.formatted || ""} · Dogs:{" "}
                      {c.dogs || ""}
                    </div>
                    <div className="tiny">
                      Meet & greet: {c.meetGreet?.date || ""}{" "}
                      {c.meetGreet?.time || ""}
                    </div>
                    {c.adminNotes ? (
                      <div className="tiny muted">Notes: {c.adminNotes}</div>
                    ) : null}
                  </div>
                  <div
                    className="stack"
                    style={{ gap: 6, alignItems: "flex-end" }}
                  >
                    <label
                      className="tiny"
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="checkbox"
                        data-idx={idx}
                        checked={approvalDraft[idx] ?? !!c.approved}
                        onChange={(e) =>
                          handleApprovalToggle(idx, e.target.checked)
                        }
                      />{" "}
                      Approve
                    </label>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: "8px 12px", fontSize: 12 }}
                      onClick={() => openEditCustomer(idx)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          type="button"
          className="btn primary full"
          onClick={() => void saveApprovals()}
        >
          Save All Changes
        </button>
        <div id="adminMsg" className="muted">
          {adminMsg}
        </div>
      </div>

      <div
        id="editCustomerModal"
        className={editOpen ? "modal-overlay" : "modal-overlay hidden"}
      >
        <div className="card stack">
          <div
            className="row"
            style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <strong>Edit Customer</strong>
            <button type="button" className="btn" onClick={closeEditModal}>
              Close
            </button>
          </div>
          <input type="hidden" id="ec_idx" value={editIdx ?? ""} readOnly />
          <div className="two">
            <div className="stack">
              <label className="field-label" htmlFor="ec_name">
                NAME
              </label>
              <input
                id="ec_name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="stack">
              <label className="field-label" htmlFor="ec_email">
                EMAIL
              </label>
              <input
                id="ec_email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="two">
            <div className="stack">
              <label className="field-label" htmlFor="ec_phone">
                PHONE
              </label>
              <input
                id="ec_phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="stack">
              <label className="field-label" htmlFor="ec_dogs">
                DOGS
              </label>
              <input
                id="ec_dogs"
                value={editForm.dogs}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, dogs: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="stack">
            <label className="field-label" htmlFor="ec_address">
              ADDRESS
            </label>
            <input
              id="ec_address"
              value={editForm.address}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, address: e.target.value }))
              }
            />
          </div>
          <div className="stack">
            <label className="field-label" htmlFor="ec_notes">
              NOTES
            </label>
            <input
              id="ec_notes"
              value={editForm.notes}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
          <div className="stack">
            <label className="field-label" htmlFor="ec_accessNotes">
              ACCESS INSTRUCTIONS
            </label>
            <textarea
              id="ec_accessNotes"
              placeholder="Lockbox code, gate info, leash location, alarm code..."
              style={{ minHeight: 60 }}
              value={editForm.accessNotes}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, accessNotes: e.target.value }))
              }
            />
          </div>
          <div className="stack">
            <label className="field-label" htmlFor="ec_adminNotes">
              ADMIN NOTES (private)
            </label>
            <textarea
              id="ec_adminNotes"
              value={editForm.adminNotes}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, adminNotes: e.target.value }))
              }
            />
          </div>
          <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              id="ec_approved"
              type="checkbox"
              checked={editForm.approved}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, approved: e.target.checked }))
              }
            />
            <span>Approved</span>
          </label>
          <button
            type="button"
            className="btn primary full"
            onClick={() => void saveEditCustomer()}
          >
            Save Changes
          </button>
          <div className="hr" />
          <button
            type="button"
            className="btn emergency full"
            onClick={() => {
              if (editIdx === null || !customers[editIdx]) return;
              const c = customers[editIdx];
              setDeleteConfirm({
                idx: editIdx,
                name: c.name || c.email || "this customer",
              });
            }}
          >
            Delete This Customer
          </button>
          <div id="ec_msg" className="muted">
            {ecMsg}
          </div>
        </div>
      </div>

      {deleteConfirm ? (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h3>Delete Customer?</h3>
            <p>
              This will permanently remove <strong>{deleteConfirm.name}</strong>
              . This cannot be undone.
            </p>
            <div className="confirm-btns">
              <button
                type="button"
                className="btn"
                onClick={() => setDeleteConfirm(null)}
              >
                Keep
              </button>
              <button
                type="button"
                className="btn emergency"
                onClick={() => void confirmDeleteCustomer()}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
