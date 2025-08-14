import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api"; // baseURL should point to http://localhost:5000/api or /api

export default function OrganizerTicketSales() {
  // ---- organizerId: robust extraction ----
  let organizerId = null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      organizerId = u?._id || u?.id || null;
    }
  } catch {
    organizerId = null;
  }

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pPays, setPPays] = useState([]);       // performer payments
  const [loadingPays, setLoadingPays] = useState(true);

  const [submitting, setSubmitting] = useState(null); // eventId:performerId while confirming
  const [err, setErr] = useState("");

  // ---------- loaders ----------
  const loadTickets = async () => {
    if (!organizerId) return;
    try {
      setErr("");
      setLoading(true);
      const { data } = await api.get(`/tickets/organizer/${organizerId}`);
      setTickets(data?.tickets || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  const loadPerformerPays = async () => {
    if (!organizerId) return;
    try {
      setErr("");
      setLoadingPays(true);
      const { data } = await api.get(`/participations/payments/for-organizer/${organizerId}`);
      const list = Array.isArray(data) ? data.slice() : [];
      // pending first, then latest paid
      list.sort((a, b) => {
        const aw = a.payment?.status === "pending" ? 0 : 1;
        const bw = b.payment?.status === "pending" ? 0 : 1;
        if (aw !== bw) return aw - bw;
        const at = a.payment?.paidAt ? new Date(a.payment.paidAt).getTime() : 0;
        const bt = b.payment?.paidAt ? new Date(b.payment.paidAt).getTime() : 0;
        return bt - at;
      });
      setPPays(list);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load performer payments.");
    } finally {
      setLoadingPays(false);
    }
  };

  useEffect(() => {
    if (!organizerId) return;
    loadTickets();
    loadPerformerPays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizerId]);

  // ---------- actions ----------
  const handleApprove = async (transactionId) => {
    if (!transactionId) return;
    try {
      await api.put(`/transactions/approve/${transactionId}`);
      await loadTickets();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to approve commission.");
    }
  };

  const handleConfirmPerformPay = async (eventId, performerId) => {
    if (!eventId || !performerId) return;
    if (!window.confirm("Confirm payment only after the money has actually arrived.")) return;

    const key = `${eventId}:${performerId}`;
    try {
      setSubmitting(key);
      await api.patch(`/participations/${eventId}/${performerId}/confirm-pay`, {});
      await loadPerformerPays();
      alert("Payment confirmed. Now you can schedule from Organizer Dashboard.");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to confirm payment.");
    } finally {
      setSubmitting(null);
    }
  };

  // ---------- aggregates (tickets) ----------
  const totals = useMemo(() => {
    let qty = 0, amount = 0;
    tickets.forEach((t) => {
      qty += Number(t?.ticket?.qty || 0);
      amount += Number(t?.ticket?.amount || 0);
    });
    return { qty, amount, commission: amount * 0.13 };
  }, [tickets]);

  // ---------- UI guards ----------
  if (!organizerId) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="p-4 rounded bg-yellow-50 text-yellow-800">
          Organizer ID not found. कृपया login गरेर फेरि खोल्नुहोस्।
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-10">
      {err ? (
        <div className="p-3 rounded bg-red-50 text-red-700 text-sm mb-2">{err}</div>
      ) : null}

      {/* Ticket Sales */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold">Tickets Sold</h2>
          <button
            onClick={loadTickets}
            className="px-3 py-1 text-sm rounded border"
            title="Reload"
          >
            Reload
          </button>
        </div>

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-2">
              <b>Total Qty:</b> {totals.qty} &nbsp; | &nbsp;
              <b>Total Amount:</b> NPR {totals.amount.toLocaleString()} &nbsp; | &nbsp;
              <b>13% Commission:</b> NPR {totals.commission.toFixed(2)}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border text-sm text-center">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-2">User</th>
                    <th className="px-2 py-2">Event</th>
                    <th className="px-2 py-2">Qty</th>
                    <th className="px-2 py-2">Total Amount</th>
                    <th className="px-2 py-2">13% Commission</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((tkt) => (
                    <tr key={tkt.ticket._id} className="border-t">
                      <td className="px-2 py-2">{tkt.user?.name || "N/A"}</td>
                      <td className="px-2 py-2">{tkt.event?.title}</td>
                      <td className="px-2 py-2">{tkt.ticket.qty}</td>
                      <td className="px-2 py-2">
                        NPR {Number(tkt.ticket.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 font-semibold text-red-700">
                        NPR {(Number(tkt.ticket.amount || 0) * 0.13).toFixed(2)}
                      </td>
                      <td className="px-2 py-2">
                        {tkt.transaction && tkt.transaction.status === "approved" ? (
                          <span className="text-green-700">Approved</span>
                        ) : (
                          <span className="text-yellow-700">Pending</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {tkt.transaction && tkt.transaction._id ? (
                          tkt.transaction.status === "approved" ? (
                            <span className="text-green-700">Approved</span>
                          ) : (
                            <button
                              className="px-3 py-1 bg-[#9C1322] text-white rounded"
                              onClick={() => handleApprove(tkt.transaction._id)}
                            >
                              Approve
                            </button>
                          )
                        ) : (
                          <span className="text-gray-400">No commission</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-gray-500">
                        No tickets yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Performer Payments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold">Performer Payments</h2>
          <button
            onClick={loadPerformerPays}
            className="px-3 py-1 text-sm rounded border"
            title="Reload"
          >
            Reload
          </button>
        </div>

        {loadingPays ? (
          <div className="text-center">Loading...</div>
        ) : pPays.length === 0 ? (
          <div className="text-center text-gray-500">No performer payments yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm text-center">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-2">Performer</th>
                  <th className="px-2 py-2">Event</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Method</th>
                  <th className="px-2 py-2">Ref</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Paid/Submitted</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pPays.map((row, idx) => {
                  const isPending = row.payment?.status === "pending";
                  const key = `${row.eventId}:${row.performerId}`;
                  return (
                    <tr key={`${row.eventId}-${row.performerId}-${idx}`} className="border-t">
                      <td className="px-2 py-2">
                        {row.performer?.name || "Performer"}
                        <div className="text-xs text-gray-500">
                          {row.performer?.email || ""}
                        </div>
                      </td>
                      <td className="px-2 py-2">{row.eventTitle}</td>
                      <td className="px-2 py-2">
                        NPR {Number(row.payment?.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-2 py-2">{row.payment?.method || "—"}</td>
                      <td className="px-2 py-2">
                        {row.payment?.ref ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono text-xs">{row.payment.ref}</span>
                            <button
                              className="px-2 py-0.5 border rounded text-xs"
                              onClick={() => navigator.clipboard.writeText(row.payment.ref)}
                              title="Copy ref"
                            >
                              Copy
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {row.payment?.status === "confirmed" ? (
                          <span className="text-green-700">Confirmed</span>
                        ) : (
                          <span className="text-yellow-700">Pending</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-600">
                        {row.payment?.paidAt
                          ? `Paid: ${new Date(row.payment.paidAt).toLocaleString()}`
                          : row.payment?.submittedByPerformerAt
                          ? `Ref: ${new Date(row.payment.submittedByPerformerAt).toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-2 py-2">
                        {isPending ? (
                          <button
                            className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-60"
                            onClick={() => handleConfirmPerformPay(row.eventId, row.performerId)}
                            disabled={submitting === key}
                            title="Confirm after you verify money actually arrived"
                          >
                            {submitting === key ? "Confirming..." : "Confirm"}
                          </button>
                        ) : (
                          <span className="text-green-700">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
