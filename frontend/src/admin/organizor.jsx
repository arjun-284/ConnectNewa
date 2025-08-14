import React, { useEffect, useState } from "react";
import axios from "axios";
import Navigation from "../../Components/Navigation";
import Footer from "../../Components/Footer";

function Organizors() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending events on mount
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/events/pending")
      .then((res) => {
        setPending(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        alert("Error fetching pending events");
      });
  }, []);

  const handleApprove = (id) => {
    axios
      .patch(`http://localhost:5000/api/events/approve/${id}`)
      .then(() => setPending((prev) => prev.filter(e => e._id !== id)))
      .catch(() => alert("Failed to approve event"));
  };

  const handleReject = (id) => {
    axios
      .patch(`http://localhost:5000/api/events/reject/${id}`)
      .then(() => setPending((prev) => prev.filter(e => e._id !== id)))
      .catch(() => alert("Failed to reject event"));
  };

  return (
    <>
      
      <div className="max-w-3xl mx-auto mt-10 bg-white shadow p-6 rounded">
        <h2 className="text-2xl font-bold mb-4">Pending Events Approval</h2>
        {loading ? (
          <div>Loading...</div>
        ) : pending.length === 0 ? (
          <p className="text-gray-500">No pending events found.</p>
        ) : (
          <ul className="space-y-4">
            {pending.map(event => (
              <li key={event._id} className="border p-4 rounded flex justify-between items-center">
                <div>
                  <div className="font-semibold">{event.title}</div>
                  <div className="text-gray-600">{event.description}</div>
                  <div className="text-sm text-gray-500">Category: {event.category || "Uncategorized"}</div>
                  <div className="text-sm text-gray-500">Tags: {event.tags?.join(', ') || "None"}</div>
                </div>
                <div>
                  <button
                    onClick={() => handleApprove(event._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded mr-2"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(event._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
     
    </>
  );
}

export default Organizors;
