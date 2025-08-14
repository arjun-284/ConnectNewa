import React, { useEffect, useState } from "react";

export default function BookTicketModal({ show, onClose, event, onBooked }) {
  // hooks (order never changes)
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // read user on mount, whenever the modal opens, and on cross-tab changes
  useEffect(() => {
    const readUser = () => {
      try {
        const u = JSON.parse(localStorage.getItem("user")) || null;
        // normalize id so both id/_id work everywhere
        if (u && !u._id && u.id) u._id = u.id;
        setUser(u);
      } catch {
        setUser(null);
      }
    };
    readUser();
    if (show) readUser();
    window.addEventListener("storage", readUser);
    return () => window.removeEventListener("storage", readUser);
  }, [show]);

  if (!show) return null;
  if (!event) return null;

  // use normalized id
  const userId = user?._id || null;
  const notLoggedIn = !userId;

  const ticketPrice = Number.isFinite(event?.price) ? Number(event.price) : 0;
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
  const total = ticketPrice * safeQty;

  const handleBook = async () => {
    if (notLoggedIn) {
      window.location.href = "/login"; // or navigate('/login')
      return;
    }
    if (safeQty < 1) {
      setError("Please select at least 1 ticket.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/tickets/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          eventId: event._id,
          userId,            // ✅ normalized id
          qty: safeQty,
          price: ticketPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Booking failed");
      }

      setLoading(false);
      setQty(1);
      onBooked?.(data.ticket);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Booking failed");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
      <div className="bg-white rounded-xl p-7 shadow-xl w-[90vw] max-w-sm relative">
        <button
          className="absolute right-3 top-3 text-xl"
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-2">Book Ticket</h2>

        <div className="mb-4 text-sm">
          <div><b>Event:</b> {event.title}</div>
          <div><b>Date:</b> {event.date ? new Date(event.date).toLocaleString() : "--"}</div>
          <div><b>Price per ticket:</b> NPR {ticketPrice}</div>
          <div><b>Total:</b> NPR {total}</div>
        </div>

        <div className="flex gap-2 items-center mb-5">
          <span>Qty:</span>
          <input
            type="number"
            min={1}
            max={10}
            value={safeQty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="border rounded px-2 py-1 w-16"
            disabled={loading}
          />
        </div>

        {notLoggedIn && (
          <div className="text-red-600 text-sm mb-3">
            Please log in to book tickets.
          </div>
        )}
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

        <button
          className={`bg-[#9C1322] text-white px-5 py-2 rounded w-full font-semibold transition-opacity ${
            loading ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={loading}
          onClick={handleBook}
        >
          {notLoggedIn ? "Go to Login" : loading ? "Booking..." : "Book Now"}
        </button>
      </div>
    </div>
  );
}
