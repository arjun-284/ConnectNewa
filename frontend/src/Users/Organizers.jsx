import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "../../Components/Navigation";
import { api } from "../api";
import Footer from "../../Components/Footer";

/* ---------- helpers ---------- */
function getOrganizer() {
  try {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : {};
    return user || {};
  } catch {
    return {};
  }
}

const NAV_LINKS = [
  { label: "Dashboard", icon: "🏠", href: "/organizers" },
  { label: "Sales Tickets", icon: "🎟️", href: "/organizer-ticket-sales" },
];

function pill(color) {
  const map = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    gray: "bg-gray-100 text-gray-700",
    purple: "bg-purple-100 text-purple-800",
    indigo: "bg-indigo-100 text-indigo-800",
    emerald: "bg-emerald-100 text-emerald-800",
  };
  return `px-2 py-1 rounded-full text-xs font-semibold ${map[color] || map.gray}`;
}
function eventStatusColor(s) {
  if (s === "approved") return pill("green");
  if (s === "rejected") return pill("red");
  return pill("yellow");
}
function stepStatusColor(s) {
  if (s === "requested") return pill("yellow");
  if (s === "accepted") return pill("indigo");
  if (s === "pay_pending") return pill("yellow");
  if (s === "paid") return pill("emerald");
  if (s === "scheduled") return pill("purple");
  if (s === "rejected") return pill("red");
  return pill("gray");
}

/* UI → backend enum map */
const UI_CATEGORIES = ["Dance", "Music", "Drama", "Comedy", "Other"];
const mapUiToEnum = (ui) => {
  const v = String(ui || "").toLowerCase();
  if (v === "dance") return "dance";
  if (v === "music") return "music";
  if (v === "drama" || v === "comedy") return "art";
  return "other";
};

/* ---------- component ---------- */
export default function MyEvents() {
  const ORGANIZER = useMemo(() => getOrganizer(), []);
  const ORGANIZER_ID = ORGANIZER._id || ORGANIZER.id || "";

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);

  // participation requests
  const [requests, setRequests] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Competitor directory + booking
  const [compFilter, setCompFilter] = useState({ q: "", category: "" });
  const [competitors, setCompetitors] = useState([]);
  const [bookModal, setBookModal] = useState({ open: false, competitor: null });
  const [bookingForm, setBookingForm] = useState({ date: "", amount: "", notes: "" });
  const [myBookings, setMyBookings] = useState([]);

  const lastEvent = events[0] || null;

  /* ---------- data fetch ---------- */
  useEffect(() => {
    if (!ORGANIZER_ID) return;
    setLoading(true);
    api
      .get(`/events/createdby/${ORGANIZER_ID}`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setEvents(data.slice().reverse());
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [ORGANIZER_ID, refreshKey]);

  useEffect(() => {
    if (!ORGANIZER_ID) return;
    api
      .get(`/participations/requests/for-organizer/${ORGANIZER_ID}`)
      .then((res) => setRequests(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Failed to fetch organizer requests", err));
  }, [ORGANIZER_ID, refreshKey]);

  const fetchCompetitors = async () => {
    const cat = compFilter.category ? mapUiToEnum(compFilter.category) : undefined;
    const res = await api.get("/competitors", {
      params: { q: compFilter.q || undefined, category: cat },
    });
    setCompetitors(Array.isArray(res.data) ? res.data : []);
  };

  const fetchMyBookings = async () => {
    if (!ORGANIZER_ID) return;
    const res = await api.get("/bookings", { params: { organizerId: ORGANIZER_ID } });
    setMyBookings(Array.isArray(res.data) ? res.data : []);
  };

  // load competitors whenever category changes or on Apply
  useEffect(() => {
    fetchCompetitors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compFilter.category]);

  // initial bookings
  useEffect(() => {
    fetchMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ORGANIZER_ID]);

  /* ---------- actions ---------- */
  const handleCreate = (e) => {
    e.preventDefault();
    if (!title || !date || price === "") {
      alert("Title, date, and price are required.");
      return;
    }
    if (!ORGANIZER_ID) {
      alert("Organizer not found. Please log in again.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("date", date);
    formData.append("location", location.trim());
    formData.append("price", String(price));
    formData.append("createdBy", ORGANIZER_ID);
    if (image) formData.append("image", image);

    api
      .post(`/events`, formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((res) => {
        const created = res.data || null;
        if (created) setEvents((prev) => [created, ...prev]);
        setTitle("");
        setDescription("");
        setDate("");
        setLocation("");
        setPrice("");
        setImage(null);
        alert("Event created and sent for approval!");
      })
      .catch((err) =>
        alert("Error creating event: " + (err?.response?.data?.error || err.message))
      );
  };

  async function acceptRequest(eventId, performerId) {
    try {
      await api.patch(`/participations/${eventId}/${performerId}/accept`);
      if (confirm("Accepted! Define payment now?")) {
        await definePaymentPending(eventId, performerId);
      }
      setRefreshKey((k) => k + 1);
    } catch {
      alert("Failed to accept request.");
    }
  }

  async function definePaymentPending(eventId, performerId) {
    const amountStr = prompt("Set fee amount for this performer (NPR)?");
    if (amountStr === null) return;
    const amount = Number(amountStr);
    if (Number.isNaN(amount) || amount < 0) {
      alert("Please enter a valid amount.");
      return;
    }
    const method =
      prompt("Preferred method? (esewa/khalti/mypay/bank/cash)", "esewa") || "esewa";
    try {
      await api.patch(`/participations/${eventId}/${performerId}/pay`, {
        amount,
        method,
        ref: "",
      });
      alert(
        "Payment set to Pending. Performer will pay and add Ref. You will confirm from Sales page."
      );
      setRefreshKey((k) => k + 1);
    } catch {
      alert("Failed to set payment (pending).");
    }
  }

  async function setSchedule(eventId, performerId) {
    const datetimeISO = prompt("Schedule (YYYY-MM-DDTHH:mm)");
    if (!datetimeISO) return;
    const stage = prompt("Stage (optional)", "Main Stage") || "Main Stage";
    const note = prompt("Note (optional)", "") || "";
    try {
      await api.patch(`/participations/${eventId}/${performerId}/schedule`, {
        datetimeISO,
        stage,
        note,
      });
      alert("Scheduled!");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to set schedule.");
    }
  }

  // --- booking flow to competitor from organizer ---
  const openBook = (c) => {
    setBookModal({ open: true, competitor: c });
    setBookingForm({ date: "", amount: "", notes: "" });
  };
  const sendBooking = async () => {
    if (!bookModal.competitor) return;
    if (!ORGANIZER_ID) return alert("Organizer not found.");
    try {
      await api.post("/bookings", {
        organizerId: ORGANIZER_ID,
        competitorId: bookModal.competitor._id,
        date: bookingForm.date,
        amount: Number(bookingForm.amount || 0),
        notes: bookingForm.notes,
      });
      setBookModal({ open: false, competitor: null });
      alert("Request sent to competitor.");
      fetchMyBookings();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to send booking");
    }
  };

  const IMG_BASE = "http://localhost:5000";

  return (
    <>
      <Navigation />
      <div className="min-h-screen flex bg-[#F6F1F1]">
        {/* Sidebar */}
        <aside
          className={`
            fixed z-30 inset-y-0 left-0 bg-[#9C1322] text-white w-64 transform transition-transform
            ${sidebarOpen ? "translate-x-0" : "-translate-x-64"}
            md:relative md:translate-x-0 md:w-60
            flex flex-col py-6 shadow-2xl
          `}
          style={{ borderTopRightRadius: 36, borderBottomRightRadius: 36 }}
        >
          <button
            className="absolute top-4 right-4 md:hidden text-white"
            onClick={() => setSidebarOpen(false)}
          >
            ✖
          </button>

          <div className="flex flex-col items-center mb-10 px-4">
            <div className="bg-white text-[#9C1322] rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold border-2 border-[#FFD700] shadow mb-3">
              {(ORGANIZER.name || "O").charAt(0).toUpperCase()}
            </div>
            <div className="text-lg font-bold truncate max-w-[180px]">
              {ORGANIZER.name || "Organizer"}
            </div>
            <div className="text-xs text-gray-200 truncate max-w-[180px]">
              {ORGANIZER.email || ""}
            </div>
          </div>

          <nav className="flex-1 px-5 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#FFD700] hover:text-[#9C1322] transition"
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main */}
        <main className="flex-1 p-4 md:p-10">
          <div className="flex md:hidden items-center mb-6">
            <button
              className="text-3xl text-[#9C1322] mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <span className="text-2xl font-extrabold text-[#9C1322]">
              Organizer Dashboard
            </span>
          </div>

          {/* Top header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-[#9C1322] mb-1">
                Organizer Dashboard
              </h1>
              <p className="text-gray-500">
                Manage your events and bookings.
              </p>
            </div>
            {lastEvent && (
              <div className="text-sm text-gray-400 md:text-right">
                Last created:{" "}
                <span className="font-semibold text-gray-700">
                  {lastEvent.title}
                </span>{" "}
                on {lastEvent.date ? new Date(lastEvent.date).toLocaleDateString() : "--"}
              </div>
            )}
          </div>

          {/* ===== Overview content (only) ===== */}

          {/* Participation Requests */}
          <div className="bg-white border rounded-lg shadow p-6 mb-10">
            <h2 className="text-xl font-bold mb-4 text-[#9C1322]">
              Participation Requests
            </h2>
            {requests.length === 0 ? (
              <p className="text-gray-500">No requests yet.</p>
            ) : (
              <div className="space-y-3">
                {requests.map((r, i) => {
                  const performerId = r.performer?._id || r.performerId;
                  const isPayPending =
                    r.payment?.status === "pending" || r.status === "pay_pending";
                  const isPaidConfirmed =
                    r.payment?.status === "confirmed" || r.status === "paid";

                  return (
                    <div
                      key={`${r.eventId}-${performerId || i}-${r.status}-${i}`}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 border rounded p-3"
                    >
                      <div>
                        <div className="font-semibold">{r.eventTitle}</div>
                        <div className="text-sm text-gray-600">
                          {r.performer?.name || "Performer"}{" "}
                          <span className="text-xs">
                            ({r.performer?.competitionType || "—"})
                          </span>{" "}
                          —{" "}
                          <span className={stepStatusColor(r.status)}>{r.status}</span>
                        </div>

                        {isPaidConfirmed ? (
                          <div className="text-xs text-gray-600 mt-1">
                            Paid NPR {r.payment?.amount} at{" "}
                            {r.payment?.paidAt
                              ? new Date(r.payment.paidAt).toLocaleString()
                              : "—"}
                            {r.payment?.method ? ` via ${r.payment.method}` : ""}
                            {r.payment?.ref ? ` (Ref: ${r.payment.ref})` : ""}
                          </div>
                        ) : isPayPending ? (
                          <div className="text-xs text-gray-600 mt-1">
                            Payment Pending — NPR {r.payment?.amount ?? 0} via{" "}
                            {r.payment?.method || "—"}
                            {r.payment?.ref ? ` (Ref: ${r.payment.ref})` : ""}
                          </div>
                        ) : null}

                        {r.schedule?.date && (
                          <div className="text-xs text-gray-600 mt-1">
                            Scheduled:{" "}
                            <b>{new Date(r.schedule.date).toLocaleString()}</b>{" "}
                            {r.schedule?.stage ? `— ${r.schedule.stage}` : ""}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {r.status === "requested" && performerId && (
                          <button
                            onClick={() => acceptRequest(r.eventId, performerId)}
                            className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            Accept
                          </button>
                        )}

                        {r.status === "accepted" &&
                          performerId &&
                          !isPayPending &&
                          !isPaidConfirmed && (
                            <button
                              onClick={() =>
                                definePaymentPending(r.eventId, performerId)
                              }
                              className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              Define Payment (Pending)
                            </button>
                          )}

                        {(isPaidConfirmed || r.status === "scheduled") && performerId && (
                          <button
                            onClick={() => setSchedule(r.eventId, performerId)}
                            className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
                          >
                            Set Schedule
                          </button>
                        )}

                        {isPayPending && (
                          <span className="px-3 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold">
                            Waiting for payment confirmation (Sales page)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Find Competitors & Request Participation */}
          <div className="bg-white border rounded-lg shadow p-6 mb-10">
            <h2 className="text-xl font-bold mb-4 text-[#9C1322]">
              Find Competitors & Request Participation
            </h2>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium">Search</label>
                <input
                  className="border rounded-lg p-2"
                  placeholder="Group or keyword"
                  value={compFilter.q}
                  onChange={(e) =>
                    setCompFilter((s) => ({ ...s, q: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && fetchCompetitors()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium">Category</label>
                <select
                  className="border rounded-lg p-2"
                  value={compFilter.category}
                  onChange={(e) =>
                    setCompFilter((s) => ({ ...s, category: e.target.value }))
                  }
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

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {competitors
                .filter((c) =>
                  compFilter.q
                    ? JSON.stringify(c)
                        .toLowerCase()
                        .includes(compFilter.q.toLowerCase())
                    : true
                )
                .map((c) => {
                  const firstCat =
                    (Array.isArray(c.competitionTypes) && c.competitionTypes[0]) || "";
                  const uiCat = firstCat
                    ? firstCat.charAt(0).toUpperCase() + firstCat.slice(1)
                    : "-";
                  return (
                    <div key={c._id} className="rounded-xl border p-4 bg-white shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold">{c.groupName}</h3>
                          {c.teamName ? (
                            <div className="text-xs text-gray-600">
                              Team: {c.teamName}
                            </div>
                          ) : null}
                        </div>
                        <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100">
                          {uiCat}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{c.description}</p>

                      <div className="mt-2 text-sm space-y-1">
                        <div>
                          <strong>Functions:</strong>{" "}
                          {(c.functions || []).join(", ")}
                        </div>
                        <div>
                          <strong>Competitions:</strong>{" "}
                          {(c.competitionTypes || []).join(", ")}
                        </div>
                        <div>
                          <strong>Styles:</strong>{" "}
                          {(c.performances || []).join(", ")}
                        </div>
                        <div className="flex gap-4 text-gray-800">
                          <span>👥 {c.members || 1}</span>
                          <span>📍 {c.location || "-"}</span>
                          <span>💵 NPR {c.rate || 0}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => openBook(c)}
                          className="px-3 py-1 rounded-lg border"
                        >
                          Request Participation
                        </button>
                      </div>
                    </div>
                  );
                })}
              {competitors.length === 0 && (
                <div className="text-gray-500">No competitor profiles yet.</div>
              )}
            </div>
          </div>

          {/* My Booking Requests */}
          <div className="bg-white border rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-[#9C1322]">
              My Booking Requests (to competitors)
            </h2>
            <button
              className="mb-3 px-3 py-1 rounded border text-sm"
              onClick={fetchMyBookings}
            >
              Refresh
            </button>
            {myBookings.length === 0 ? (
              <p className="text-gray-500">No requests sent yet.</p>
            ) : (
              <div className="space-y-2">
                {myBookings.map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center justify-between border rounded p-3"
                  >
                    <div className="text-sm">
                      <div className="font-semibold">
                        Competitor:{" "}
                        {b.competitorId?.groupName ||
                          b.competitorName ||
                          b.competitorId ||
                          "—"}
                      </div>
                      <div>
                        Date: {b.date ? new Date(b.date).toLocaleDateString() : "-"}
                      </div>
                      <div>Amount: NPR {b.amount ?? 0}</div>
                    </div>
                    <span className={stepStatusColor(b.status)}>{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Events */}
          <div className="bg-white border rounded-lg shadow p-6 mt-10">
            <h2 className="text-xl font-bold mb-4 text-[#9C1322]">Create New Event</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <input
                  className="w-full border p-2 rounded mb-2"
                  placeholder="Event Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <textarea
                  className="w-full border p-2 rounded mb-2"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
                <input
                  className="w-full border p-2 rounded mb-2"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <input
                  className="w-full border p-2 rounded mb-2"
                  type="number"
                  placeholder="Ticket Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min={0}
                  required
                />
              </div>
              <div>
                <input
                  className="w-full border p-2 rounded mb-2"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <input
                  className="w-full border p-2 rounded mb-2"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
                <button
                  className="w-full bg-[#9C1322] text-white px-4 py-2 rounded font-semibold hover:bg-[#b81c36] transition"
                  type="submit"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>

          {/* My Created Events */}
          <div className="bg-white border rounded-lg shadow p-6 mt-10">
            <h2 className="text-xl font-bold mb-5 text-[#9C1322]">My Created Events</h2>
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : events.length === 0 ? (
              <p className="text-gray-500">You have not created any events.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 font-semibold text-gray-700">Image</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Title</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Price</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Date</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Location</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev._id} className="border-b">
                        <td className="px-3 py-2">
                          {ev.imageUrl ? (
                            <img
                              src={`${IMG_BASE}${ev.imageUrl}`}
                              alt="event"
                              className="w-14 h-10 object-cover rounded"
                            />
                          ) : (
                            <span className="text-gray-300 italic">No image</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-semibold">{ev.title}</td>
                        <td className="px-3 py-2">NPR {ev.price ?? "--"}</td>
                        <td className="px-3 py-2">
                          {ev.date
                            ? new Date(ev.date).toLocaleDateString()
                            : "--"}
                        </td>
                        <td className="px-3 py-2">{ev.location || "--"}</td>
                        <td className="px-3 py-2">
                          <span className={eventStatusColor(ev.status)}>
                            {ev.status || "pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* BOOKING MODAL */}
      {bookModal.open && bookModal.competitor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-full max-w-md">
            <div className="text-lg font-semibold">
              Request participation: {bookModal.competitor.groupName}
            </div>
            <div className="mt-3 space-y-2">
              <div>
                <label className="text-sm">Date</label>
                <input
                  type="date"
                  className="w-full border rounded-lg p-2"
                  value={bookingForm.date}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm">Amount (NPR)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2"
                  value={bookingForm.amount}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, amount: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm">Notes</label>
                <textarea
                  className="w-full border rounded-lg p-2"
                  rows={2}
                  value={bookingForm.notes}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                className="px-3 py-1 rounded-lg border"
                onClick={() => setBookModal({ open: false, competitor: null })}
              >
                Cancel
              </button>
              <button className="px-3 py-1 rounded-lg bg-black text-white" onClick={sendBooking}>
                Send Request
              </button>
            </div>
          </div>
        </div>
        
      )}
      <Footer/>
    </>
  );
}

/* ---------- tiny helpers ---------- */
function displayName(v) {
  if (!v) return "—";
  if (typeof v === "string") return v;
  return v.groupName || v.teamName || v.name || v._id || "—";
}
function idFrom(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v._id || "";
}
