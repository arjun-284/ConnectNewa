import React, { useEffect, useState } from "react";
import axios from "axios";
import Navigation from "../../Components/Navigation";
import { Link } from "react-router-dom";

function getUser() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user || {};
  } catch {
    return {};
  }
}

export default function MyTickets() {
  const USER = getUser();
  const USER_ID = USER._id || USER.id || "";
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!USER_ID) return;
    axios.get(`http://localhost:5000/api/tickets/user/${USER_ID}`)
      .then(res => {
        setTickets(res.data.tickets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [USER_ID]);

  return (
    <>
      <Navigation />
      <div className="max-w-4xl mx-auto mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-[#9C1322]">My Tickets</h2>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="text-gray-400">You haven't booked any tickets yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 font-semibold text-gray-700">Event</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Qty</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Price</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Date</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Status</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t._id}>
                    <td className="px-3 py-2">{t.event?.title || "N/A"}</td>
                    <td className="px-3 py-2">{t.qty}</td>
                    <td className="px-3 py-2">NPR {t.amount}</td>
                    <td className="px-3 py-2">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 capitalize">{t.status}</td>
                    <td className="px-3 py-2">
                      <Link to={`/invoice/${t._id}`} className="text-indigo-600 underline">
                        View Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
