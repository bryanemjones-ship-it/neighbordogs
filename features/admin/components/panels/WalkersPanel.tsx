"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadWalkers,
  nextLocalId,
  saveWalkers,
  type LegacyWalker,
} from "@/features/booking/lib/models";

type WalkersPanelProps = {
  showToast: (title: string, message: string) => void;
};

export function WalkersPanel({ showToast }: WalkersPanelProps) {
  const [walkers, setWalkers] = useState<LegacyWalker[]>([]);
  const [walkerListMsg, setWalkerListMsg] = useState("");
  const [newWalkerName, setNewWalkerName] = useState("");
  const [newWalkerPhone, setNewWalkerPhone] = useState("");
  const [addWalkerMsg, setAddWalkerMsg] = useState("");

  const adminLoadWalkers = useCallback(() => {
    setWalkerListMsg("Loading…");
    const loaded = loadWalkers();
    setWalkers(loaded);
    setWalkerListMsg("");
  }, []);

  useEffect(() => {
    adminLoadWalkers();
  }, [adminLoadWalkers]);

  function adminAddWalker() {
    if (!newWalkerName.trim()) {
      setAddWalkerMsg("Enter a name.");
      return;
    }
    setAddWalkerMsg("Adding…");
    const list = loadWalkers();
    list.push({
      id: nextLocalId(list),
      name: newWalkerName.trim(),
      phone: newWalkerPhone.trim() || undefined,
    });
    saveWalkers(list);
    setWalkers(list);
    setNewWalkerName("");
    setNewWalkerPhone("");
    setAddWalkerMsg("✅ Added!");
  }

  function adminRemoveWalker(id: number, name: string) {
    const ok = window.confirm(`Remove ${name} from your walker list?`);
    if (!ok) return;
    const next = loadWalkers().filter((w) => w.id !== id);
    saveWalkers(next);
    setWalkers(next);
    showToast("Removed", `${name} removed.`);
  }

  return (
    <div id="adminPanelWalkers" className="stack">
      <div className="card stack">
        <div className="field-label">YOUR WALKERS</div>
        <div className="muted">
          Assign walkers to bookings. The assigned name appears in &quot;On My
          Way&quot; texts to customers.
        </div>
        <div id="walkerList" className="stack" style={{ gap: 8 }}>
          {!walkers.length ? (
            <div className="muted" style={{ textAlign: "center", padding: 12 }}>
              No walkers yet. Add one below.
            </div>
          ) : (
            walkers.map((w) => (
              <div
                key={w.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.7)",
                  borderRadius: 12,
                }}
              >
                <div>
                  <strong style={{ fontSize: 15 }}>{w.name}</strong>
                  {w.phone ? (
                    <span className="muted tiny" style={{ marginLeft: 8 }}>
                      {w.phone}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{
                    padding: "5px 10px",
                    fontSize: 12,
                    color: "var(--red)",
                  }}
                  onClick={() => adminRemoveWalker(w.id, w.name)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
        <div id="walkerListMsg" className="muted">
          {walkerListMsg}
        </div>
      </div>
      <div className="card stack">
        <div className="field-label">ADD NEW WALKER</div>
        <div className="two">
          <div className="stack">
            <label className="field-label" htmlFor="newWalkerName">
              NAME
            </label>
            <input
              id="newWalkerName"
              placeholder="e.g. Hans"
              value={newWalkerName}
              onChange={(e) => setNewWalkerName(e.target.value)}
            />
          </div>
          <div className="stack">
            <label className="field-label" htmlFor="newWalkerPhone">
              PHONE (optional)
            </label>
            <input
              id="newWalkerPhone"
              type="tel"
              placeholder="919-555-1234"
              value={newWalkerPhone}
              onChange={(e) => setNewWalkerPhone(e.target.value)}
            />
          </div>
        </div>
        <button type="button" className="btn primary" onClick={adminAddWalker}>
          Add Walker
        </button>
        <div id="addWalkerMsg" className="muted">
          {addWalkerMsg}
        </div>
      </div>
    </div>
  );
}
