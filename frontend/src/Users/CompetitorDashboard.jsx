import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

/* ---------- user helper (normalized id) ---------- */
function getUser() {
  try {
    const raw = localStorage.getItem("user");
    const u = raw ? JSON.parse(raw) : {};
    if (u && !u._id && u.id) u._id = u.id; // normalize
    return u || {};
  } catch {
    return {};
  }
}

/* ---------- constants & tiny helpers ---------- */
const UI_CATEGORIES = ["Dance", "Music", "Drama", "Comedy", "Other"];
const PHONE_RE = /^\+?[0-9\-()\s]{7,20}$/;

const mapUiToEnum = (ui) => {
  const v = String(ui || "").toLowerCase();
  if (v === "dance") return "dance";
  if (v === "music") return "music";
  if (v === "drama" || v === "comedy") return "art";
  return "other";
};

// show category label from either `category` or `competitionTypes[0]`
function catLabel(c) {
  const a = (c?.category || "").toString();
  if (a) return a.charAt(0).toUpperCase() + a.slice(1);
  const arr = Array.isArray(c?.competitionTypes) ? c.competitionTypes : [];
  const first = (arr[0] || "").toString();
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "-";
}

export default function CompetitorDashboard() {
  const user = useMemo(() => getUser(), []);
  const [tab, setTab] = useState("browse"); // browse | create | requests
  const [loading, setLoading] = useState(false);

  // ------- Competitors -------
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState({ q: "", category: "" });

  const [form, setForm] = useState({
    groupName: "",
    teamName: "",
    description: "",
    category: "Dance",
    functions: "",
    competitions: "",
    performances: "",
    members: 1,
    location: "",
    contact: "",
    rate: 0,
    availableDates: "",
  });

  // My competitor id (to view incoming requests)
  const [myCompetitorId, setMyCompetitorId] = useState(
    () => localStorage.getItem("myCompetitorId") || ""
  );

  // ------- Requests (Competitor side) -------
  const [bookings, setBookings] = useState([]);
  const [actionBusy, setActionBusy] = useState(""); // bookingId during accept/reject

  // ---------- API ----------

  const fetchCompetitors = async () => {
    try {
      const cat = filter.category ? mapUiToEnum(filter.category) : undefined;
      const res = await api.get("/competitors", {
        params: { category: cat, q: filter.q || undefined },
      });
      const arr = Array.isArray(res.data) ? res.data : [];
      setList(arr);

      // Auto-detect my competitor id if missing
      if (!myCompetitorId && user?._id) {
        const mine = arr.find((c) => {
          const created = c?.createdBy;
          const createdId =
            typeof created === "object" && created?._id
              ? String(created._id)
              : String(created || "");
          return createdId && createdId === String(user._id);
        });
        if (mine?._id) {
          setMyCompetitorId(mine._id);
          localStorage.setItem("myCompetitorId", mine._id);
        }
      }
    } catch (e) {
      setList([]);
      // optional: toast
    }
  };

  const fetchBookings = async () => {
    try {
      const params = myCompetitorId ? { competitorId: myCompetitorId } : undefined;
      const res = await api.get("/bookings", { params });
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBookings([]);
    }
  };

  // Initial + when category changes
  useEffect(() => {
    fetchCompetitors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.category]);

  // When switching to Requests tab OR myCompetitorId changes, refresh bookings
  useEffect(() => {
    if (tab === "requests") fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, myCompetitorId]);

  // If we have a user but no myCompetitorId on mount, try to fetch only mine
  useEffect(() => {
    (async () => {
      if (user?._id && !myCompetitorId) {
        try {
          const r = await api.get("/competitors", { params: { createdBy: user._id } });
          const mine = Array.isArray(r.data) ? r.data[0] : r.data;
          if (mine?._id) {
            setMyCompetitorId(mine._id);
            localStorage.setItem("myCompetitorId", mine._id);
          }
        } catch {
          /* ignore */
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Create competitor profile ----------

  const createCompetitor = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user?._id) {
        alert("Please log in again — user id missing.");
        return;
      }
      if (form.contact && !PHONE_RE.test(form.contact)) {
        alert("Please enter a valid contact number (e.g. +977-9800000000) or leave it blank.");
        return;
      }

      // backend expects `competitionTypes` array
      const competitionTypes = [
        mapUiToEnum(form.category),
        ...splitCSV(form.competitions).map(mapUiToEnum),
      ].filter(Boolean);

      const payload = {
        createdBy: user?._id,
        groupName: form.groupName,
        teamName: form.teamName,
        description: form.description,
        competitionTypes,
        functions: splitCSV(form.functions),
        performances: splitCSV(form.performances),
        members: Number(form.members || 1),
        location: form.location,
        contact: form.contact || "",
        rate: Number(form.rate || 0),
        availableDates: toDateArray(form.availableDates),
      };

      const res = await api.post("/competitors", payload);
      const cid = res.data?._id || "";
      if (cid) {
        localStorage.setItem("myCompetitorId", cid);
        setMyCompetitorId(cid);
      }

      // reset form
      setForm({
        groupName: "",
        teamName: "",
        description: "",
        category: "Dance",
        functions: "",
        competitions: "",
        performances: "",
        members: 1,
        location: "",
        contact: "",
        rate: 0,
        availableDates: "",
      });

      await fetchCompetitors();
      setTab("browse");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create competitor";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Respond booking ----------

  const respondBooking = async (id, status) => {
    // keep a copy for rollback
    const prev = bookings.slice();
    try {
      setActionBusy(id);
      // optimistic
      setBookings((cur) => cur.map((b) => (b._id === id ? { ...b, status } : b)));
      const res = await api.patch(`/bookings/${id}`, { status });
      setBookings((cur) => cur.map((b) => (b._id === id ? res.data : b)));
      // re-fetch to sync any server-created side effects (e.g., competition creation)
      fetchBookings();
    } catch (err) {
      setBookings(prev); // rollback
      alert(err?.response?.data?.error || "Failed to update booking");
    } finally {
      setActionBusy("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Tabs */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Competitors</h1>
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          {["browse", "create", "requests"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-lg text-sm ${tab === t ? "bg-white shadow" : ""}`}
            >
              {labelTab(t)}
            </button>
          ))}
        </div>
      </div>

      {/* FILTERS (Browse) */}
      {tab === "browse" && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium">Search</label>
              <input
                className="border rounded-lg p-2"
                placeholder="Group or keyword"
                value={filter.q}
                onChange={(e) => setFilter((s) => ({ ...s, q: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && fetchCompetitors()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium">Category</label>
              <select
                className="border rounded-lg p-2"
                value={filter.category}
                onChange={(e) => setFilter((s) => ({ ...s, category: e.target.value }))}
              >
                <option value="">All</option>
                {UI_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <button onClick={fetchCompetitors} className="px-3 py-2 rounded-lg border">
              Apply
            </button>
          </div>

          {/* BROWSE LIST (ALL COMPETITORS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            {list
              .filter((c) =>
                filter.q
                  ? JSON.stringify(c).toLowerCase().includes(filter.q.toLowerCase())
                  : true
              )
              .map((c) => (
                <div key={c._id} className="rounded-xl border p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">{c.groupName}</h3>
                      {c.teamName ? (
                        <div className="text-xs text-gray-600">Team: {c.teamName}</div>
                      ) : null}
                    </div>
                    <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100">
                      {catLabel(c)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{c.description}</p>

                  <div className="mt-2 text-sm space-y-1">
                    <div>
                      <strong>Functions:</strong> {(c.functions || []).join(", ")}
                    </div>
                    <div>
                      <strong>Competitions:</strong>{" "}
                      {(c.competitionTypes || c.competitions || []).join(", ")}
                    </div>
                    <div>
                      <strong>Styles:</strong> {(c.performances || []).join(", ")}
                    </div>
                    <div className="flex gap-4 text-gray-800">
                      <span>👥 {c.members || 1}</span>
                      <span>📍 {c.location || "-"}</span>
                      <span>💵 NPR {c.rate || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            {list.length === 0 && (
              <div className="text-gray-500">No competitor profiles yet.</div>
            )}
          </div>
        </>
      )}

      {/* CREATE PROFILE */}
      {tab === "create" && (
        <form
          onSubmit={createCompetitor}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow"
        >
          <Field label="Group Name" required>
            <input
              className="mt-1 w-full rounded-lg border p-2"
              value={form.groupName}
              onChange={(e) => setForm({ ...form, groupName: e.target.value })}
              required
            />
          </Field>
          <Field label="Team Name">
            <input
              className="mt-1 w-full rounded-lg border p-2"
              value={form.teamName}
              onChange={(e) => setForm({ ...form, teamName: e.target.value })}
            />
          </Field>

          <Field label="Category">
            <select
              className="mt-1 w-full rounded-lg border p-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {UI_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Members">
            <input
              type="number"
              className="mt-1 w-full rounded-lg border p-2"
              value={form.members}
              onChange={(e) => setForm({ ...form, members: Number(e.target.value) })}
            />
          </Field>

          <Field label="Functions they do (comma)">
            <input
              className="mt-1 w-full rounded-lg border p-2"
              placeholder="Wedding reception, Corporate show, School fest..."
              value={form.functions}
              onChange={(e) => setForm({ ...form, functions: e.target.value })}
            />
          </Field>
          <Field label="Competition types (comma)">
            <input
              className="mt-1 w-full rounded-lg border p-2"
              placeholder="Dance battle, Battle of Bands..."
              value={form.competitions}
              onChange={(e) => setForm({ ...form, competitions: e.target.value })}
            />
          </Field>

          <Field label="Performances / Styles (comma)">
            <input
              className="mt-1 w-full rounded-lg border p-2"
              placeholder="HipHop, Nepali folk..."
              value={form.performances}
              onChange={(e) => setForm({ ...form, performances: e.target.value })}
            />
          </Field>
          <Field label="Location">
            <input
              className="mt-1 w-full rounded-lg border p-2"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </Field>

          <Field label="Contact">
            <input
              className="mt-1 w-full rounded-lg border p-2"
              placeholder="+977-98..."
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
          </Field>
          <Field label="Rate (NPR per event)">
            <input
              type="number"
              className="mt-1 w-full rounded-lg border p-2"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
            />
          </Field>

          <Field label="Available Dates (comma, YYYY-MM-DD)" full>
            <input
              className="mt-1 w-full rounded-lg border p-2"
              placeholder="2025-08-20, 2025-08-26"
              value={form.availableDates}
              onChange={(e) => setForm({ ...form, availableDates: e.target.value })}
            />
          </Field>

          <Field label="Description" full>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-lg border p-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <div className="md:col-span-2 flex gap-3">
            <button disabled={loading} className="px-4 py-2 rounded-lg bg-black text-white">
              {loading ? "Saving..." : "Save Profile"}
            </button>
            <button
              type="button"
              onClick={() =>
                setForm({
                  groupName: "",
                  teamName: "",
                  description: "",
                  category: "Dance",
                  functions: "",
                  competitions: "",
                  performances: "",
                  members: 1,
                  location: "",
                  contact: "",
                  rate: 0,
                  availableDates: "",
                })
              }
              className="px-4 py-2 rounded-lg border"
            >
              Reset
            </button>
          </div>
        </form>
      )}

      {/* REQUESTS (Competitor side) */}
      {tab === "requests" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">My Competitor ID:</span>
            <input
              className="border rounded p-1 text-sm w-72"
              placeholder="(auto-saved after you create profile)"
              value={myCompetitorId}
              onChange={(e) => {
                setMyCompetitorId(e.target.value);
                localStorage.setItem("myCompetitorId", e.target.value);
              }}
            />
            <button onClick={fetchBookings} className="px-3 py-1 rounded border text-sm">
              Refresh
            </button>
          </div>

          {!myCompetitorId && (
            <div className="text-xs text-red-600">
              Create your competitor profile first (or paste your Competitor ID) to see booking requests.
            </div>
          )}

          {bookings.map((b) => {
            const isPending = String(b.status) === "pending";
            return (
              <div
                key={b._id}
                className="rounded-xl border p-4 bg-white shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="text-sm text-gray-600">Date: {safeDate(b.date)}</div>
                  <div className="text-lg font-medium">Amount: NPR {b.amount}</div>
                  <div className="text-xs mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        b.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : b.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      Status: {b.status}
                    </span>
                  </div>
                  {b.notes ? (
                    <div className="text-xs text-gray-500 mt-1">Notes: {b.notes}</div>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondBooking(b._id, "accepted")}
                    className="px-3 py-1 rounded-lg border"
                    disabled={!isPending || actionBusy === b._id}
                    title="Accept Booking"
                  >
                    {actionBusy === b._id && isPending ? "Saving..." : "Accept"}
                  </button>
                  <button
                    onClick={() => respondBooking(b._id, "rejected")}
                    className="px-3 py-1 rounded-lg border"
                    disabled={!isPending || actionBusy === b._id}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
          {bookings.length === 0 && <div className="text-gray-500">No booking requests.</div>}
        </div>
      )}
    </div>
  );
}

/* ---------- shared tiny UI/helpers ---------- */
function Field({ label, children, required, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-sm font-medium">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}
function labelTab(t) {
  if (t === "browse") return "Browse";
  if (t === "create") return "Create Profile";
  if (t === "requests") return "Booking Requests";
  return t;
}
function splitCSV(s) {
  return String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
function toDateArray(s) {
  return splitCSV(s).map((d) => {
    const v = new Date(d);
    return Number.isNaN(v.getTime()) ? undefined : v;
  }).filter(Boolean);
}
function safeDate(d) {
  if (!d) return "-";
  const v = new Date(d);
  return Number.isNaN(v.getTime()) ? String(d) : v.toLocaleDateString();
}
