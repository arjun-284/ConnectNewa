import React, { useEffect, useState } from "react";

function AdminAmountCollection() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5000/api/transactions/admin-commissions")
      .then(res => res.json())
      .then(data => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-5">Admin Amount Collection</h2>
      <div className="mb-3 font-semibold">
        Total Collected: <span className="text-[#9C1322]">NPR {total.toFixed(2)}</span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="py-8 text-center text-gray-400">No commission transactions yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2">Organizer</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tr) => (
                <tr key={tr._id}>
                  <td className="px-3 py-2">{tr.organizer?.name || "N/A"}</td>
                  <td className="px-3 py-2">{tr.event?.title || "N/A"}</td>
                  <td className="px-3 py-2">NPR {tr.amount?.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    {tr.status === "approved" ? (
                      <span className="text-green-700">Approved</span>
                    ) : (
                      <span className="text-yellow-700">Pending</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{new Date(tr.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminAmountCollection;
