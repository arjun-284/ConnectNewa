import React, { useEffect, useState } from "react";

function UserApprove() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all organizers on mount
  useEffect(() => {
    fetch("/api/employ/organizers")
      .then(res => res.json())
      .then(data => {
        setOrganizers(data);
        setLoading(false);
      })
      .catch(() => {
        setOrganizers([]);
        setLoading(false);
      });
  }, []);

  // Approve organizer
  const handleApprove = (id) => {
    fetch(`/api/employ/organizers/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    })
      .then(res => res.json())
      .then(() => setOrganizers(prev =>
        prev.map(o => o._id === id ? { ...o, status: "approved" } : o)
      ));
  };

  // Reject organizer
  const handleReject = (id) => {
    fetch(`/api/employ/organizers/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    })
      .then(res => res.json())
      .then(() => setOrganizers(prev =>
        prev.map(o => o._id === id ? { ...o, status: "rejected" } : o)
      ));
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Organizer Management</h1>
      {loading ? (
        <p>Loading...</p>
      ) : organizers.length === 0 ? (
        <p>No organizers found.</p>
      ) : (
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Registered Date</th>
              <th className="py-2 px-4 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {organizers.map(org => (
              <tr key={org._id}>
                <td className="py-2 px-4 border-b">{org.name}</td>
                <td className="py-2 px-4 border-b">{org.email}</td>
                <td className="py-2 px-4 border-b capitalize">{org.status}</td>
                <td className="py-2 px-4 border-b">
                  {org.createdAt
                    ? new Date(org.createdAt).toLocaleDateString()
                    : "--"}
                </td>
                <td className="py-2 px-4 border-b">
                  {org.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleApprove(org._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded mr-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(org._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Reject
                      </button>
                    </>
                  ) : org.status === "approved" ? (
                    <span className="text-green-700 font-semibold">Approved</span>
                  ) : (
                    <span className="text-red-700 font-semibold">Rejected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserApprove;
