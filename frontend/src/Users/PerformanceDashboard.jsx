import React, { useEffect, useMemo, useState } from "react";
import Navigation from "../../Components/Navigation";
import { api } from "../api"; // baseURL: '/api' or 'http://localhost:5000/api'

function getPerformer() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

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

function statusColor(s) {
  if (s === "requested") return pill("yellow");
  if (s === "accepted") return pill("indigo");
  if (s === "pay_pending") return pill("yellow");
  if (s === "paid") return pill("emerald");
  if (s === "scheduled") return pill("purple");
  if (s === "rejected") return pill("red");
  return pill("gray");
}

export default function PerformanceDashboard() {
  const PERFORMER = getPerformer();
  const PERFORMER_ID = PERFORMER._id || PERFORMER.id || "";

  const [participations, setParticipations] = useState([]);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingReq, setLoadingReq] = useState(false);
  const [q, setQ] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // derive counts
  const totalParticipations = participations.length;
  const acceptedCount = useMemo(
    () => participations.filter((p) => p.status === "accepted").length,
    [participations]
  );
  const paidCount = useMemo(
    () => participations.filter((p) => p.status === "paid").length,
    [participations]
  );
  const scheduledCount = useMemo(
    () => participations.filter((p) => p.status === "scheduled").length,
    [participations]
  );

  // set of eventIds already requested by this performer
  const requestedEventIds = useMemo(() => {
    const ids = new Set();
    participations.forEach((p) => {
      if (p.event?._id) ids.add(String(p.event._id));
    });
    return ids;
  }, [participations]);

  // fetch my participations
  useEffect(() => {
    if (!PERFORMER_ID) return;
    api
      .get(`/participations/for-performer/${PERFORMER_ID}`)
      .then((res) => setParticipations(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [PERFORMER_ID, refreshKey]);

  // fetch approved events
  useEffect(() => {
    setLoadingEvents(true);
    api
      .get(`/participations/events/approved`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        list.sort(() => Math.random() - 0.5);
        setApprovedEvents(list);
      })
      .finally(() => setLoadingEvents(false));
  }, []);

  // filter by search query (title / location)
  const filteredEvents = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return approvedEvents;
    return approvedEvents.filter(
      (ev) =>
        (ev.title || "").toLowerCase().includes(term) ||
        (ev.location || "").toLowerCase().includes(term)
    );
  }, [q, approvedEvents]);

  // send participation request
  async function requestParticipation(eventId) {
    if (!PERFORMER_ID) {
      alert("Please log in again.");
      return;
    }
    if (!eventId) return;

    setLoadingReq(true);
    try {
      const { data } = await api.post("/participations/request", {
        eventId,
        performerId: PERFORMER_ID,
      });
      alert(data?.message || "Participation request sent!");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to send request.");
    } finally {
      setLoadingReq(false);
    }
  }

  // performer submits payment proof (ref)
  async function submitPaymentProof(eventId) {
    const method =
      prompt("Payment method? (esewa/khalti/mypay/bank/cash)", "esewa") || "esewa";
    const ref = prompt("Transaction Ref / Trace ID? (e.g., ESW123..., KLT987...)", "");
    if (!ref) return;

    try {
      await api.patch(`/participations/${eventId}/${PERFORMER_ID}/submit-payment`, {
        method,
        ref,
      });
      alert("Thanks! Payment proof submitted. Organizer will confirm.");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert("Failed to submit payment proof.");
    }
  }

  const fallbackImg =
    "https://images.unsplash.com/photo-1521337584798-0a2f86cc03db?q=80&w=1200&auto=format&fit=crop";

  return (
    <>
      

      {/* Content (no sidebar, no footer) */}
      <div className="min-h-screen bg-[#F6F1F1]">
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-[#0B3D91] mb-1">
                Performance Dashboard
              </h1>
              <p className="text-gray-500">
                Track your participations and join events.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Logged in as</div>
              <div className="font-semibold text-gray-800">
                {PERFORMER?.name || "Performer"}
              </div>
              <div className="text-xs text-gray-500">{PERFORMER?.email || ""}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div className="bg-white border shadow rounded-lg p-4 text-center">
              <div className="text-xl font-extrabold text-[#0B3D91]">
                {totalParticipations}
              </div>
              <div className="text-gray-500 text-xs mt-1">Total Participations</div>
            </div>
            <div className="bg-white border shadow rounded-lg p-4 text-center">
              <div className="text-xl font-extrabold text-indigo-700">
                {acceptedCount}
              </div>
              <div className="text-gray-500 text-xs mt-1">Accepted</div>
            </div>
            <div className="bg-white border shadow rounded-lg p-4 text-center">
              <div className="text-xl font-extrabold text-emerald-700">{paidCount}</div>
              <div className="text-gray-500 text-xs mt-1">Paid</div>
            </div>
            <div className="bg-white border shadow rounded-lg p-4 text-center">
              <div className="text-xl font-extrabold text-purple-700">
                {scheduledCount}
              </div>
              <div className="text-gray-500 text-xs mt-1">Scheduled</div>
            </div>
          </div>

          {/* Approved Events: Search + Grid */}
          <div className="bg-white border rounded-lg shadow p-6 mb-10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-[#0B3D91]">Approved Events</h2>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title or location..."
                className="border rounded px-3 py-2 w-full md:w-80"
              />
            </div>

            {loadingEvents ? (
              <div className="text-gray-500">Loading events…</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-gray-500">No approved events found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredEvents.slice(0, 12).map((ev) => {
                  const already = requestedEventIds.has(String(ev._id));
                  return (
                    <div
                      key={ev._id}
                      className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition"
                    >
                      <div className="h-36 w-full overflow-hidden bg-gray-100">
                        <img
                          src={
                            ev.imageUrl
                              ? `http://localhost:5000${ev.imageUrl}`
                              : fallbackImg
                          }
                          alt={ev.title}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.src = fallbackImg)}
                        />
                      </div>
                      <div className="p-4">
                        <div className="font-semibold text-gray-800 truncate">
                          {ev.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {ev.location || "—"}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {ev.date ? new Date(ev.date).toLocaleDateString() : ""}
                        </div>
                        <button
                          disabled={already || loadingReq}
                          onClick={() => requestParticipation(ev._id)}
                          className={`mt-3 w-full px-3 py-2 rounded text-sm font-semibold transition
                            ${
                              already
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-[#0B3D91] text-white hover:bg-[#1450C9]"
                            }`}
                          title={
                            already
                              ? "You’ve already requested for this event"
                              : "Send participation request"
                          }
                        >
                          {already ? "Requested" : "Request to Participate"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Participations */}
          <div className="bg-white border rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-5 text-[#0B3D91]">
              My Participations
            </h2>
            {participations.length === 0 ? (
              <p className="text-gray-500">
                You haven't participated in any events yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 font-semibold text-gray-700">Event</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Location</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Status</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Payment</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Schedule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participations.map((p, idx) => {
                      const isPayPending =
                        p.status === "pay_pending" ||
                        p.payment?.status === "pending";
                      const isPaidConfirmed =
                        p.status === "paid" || p.payment?.status === "confirmed";

                      return (
                        <tr key={idx} className="border-b align-top">
                          <td className="px-3 py-2 font-semibold">
                            {p.event?.title || "--"}
                          </td>
                          <td className="px-3 py-2">{p.event?.location || "--"}</td>
                          <td className="px-3 py-2">
                            <span className={statusColor(p.status)}>{p.status}</span>
                          </td>
                          <td className="px-3 py-2">
                            {isPaidConfirmed ? (
                              <>NPR {p.payment?.amount} ({p.payment?.method})</>
                            ) : isPayPending ? (
                              <div className="space-y-2">
                                <div>
                                  <b>Amount:</b> NPR {p.payment?.amount ?? 0}{" "}
                                  <span className="text-xs text-gray-500">
                                    ({p.payment?.method || "esewa/khalti/mypay"})
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <a
                                    href="https://esewa.com.np/#/home"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 rounded border text-xs"
                                  >
                                    Pay via eSewa
                                  </a>
                                  <a
                                    href="https://khalti.com/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 rounded border text-xs"
                                  >
                                    Pay via Khalti
                                  </a>
                                  <a
                                    href="https://mypay.com.np/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 rounded border text-xs"
                                  >
                                    Pay via MyPay
                                  </a>
                                </div>
                                <button
                                  onClick={() => submitPaymentProof(p.event?._id)}
                                  className="px-3 py-1 rounded bg-emerald-600 text-white text-xs"
                                  title="Enter your transaction reference after you pay"
                                >
                                  I’ve paid — Add Ref
                                </button>
                                {p.payment?.ref && (
                                  <div className="text-xs text-gray-600">
                                    Submitted Ref: <b>{p.payment.ref}</b>{" "}
                                    <span className="text-gray-400">
                                      (waiting organizer confirmation)
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>--</>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {p.schedule?.date
                              ? new Date(p.schedule.date).toLocaleString()
                              : "--"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
