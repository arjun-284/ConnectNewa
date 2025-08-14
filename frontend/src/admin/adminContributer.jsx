import React, { useEffect, useState } from "react";
import Navigation from "../../Components/Navigation";
import axios from "axios";

function AdminContributer() {
  const [subs, setSubs] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get("http://localhost:5000/api/contributors/all")
      .then(res => setSubs(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleReview = (id, status) => {
    const comment = prompt("Optional review comment:");
    axios.patch(`http://localhost:5000/api/contributors/review/${id}`, { status, reviewComment: comment })
      .then(() => setSubs(prev => prev.map(s => s._id === id ? { ...s, status, reviewComment: comment } : s)));
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      
      <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Contributor Submissions</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-3 py-2">Title</th>
                <th>Body</th>
                <th>Media</th>
                <th>Submitted By</th>
                <th>Status</th>
                <th>Review Comment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(sub => (
                <tr key={sub._id} className="border-t">
                  <td className="px-3 py-2 font-semibold">{sub.title}</td>
                  <td className="max-w-xs px-2 py-2">
                    {sub.body.length < 100 || expanded[sub._id] ? (
                      <span>{sub.body}</span>
                    ) : (
                      <>
                        {sub.body.slice(0, 100)}...{" "}
                        <button onClick={() => toggleExpand(sub._id)} className="text-blue-600 underline">See more</button>
                      </>
                    )}
                    {sub.body.length >= 100 && expanded[sub._id] && (
                      <button onClick={() => toggleExpand(sub._id)} className="ml-2 text-blue-600 underline">See less</button>
                    )}
                  </td>
                  <td>
                    {sub.mediaUrl && (
                      <a
                        href={`http://localhost:5000${sub.mediaUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-700"
                      >
                        View
                      </a>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <b>{sub.submittedBy?.name || "User"}</b>
                    <div className="text-gray-400">{sub.submittedBy?.email}</div>
                  </td>
                  <td>
                    <span className={
                      sub.status === "approved" ? "text-green-600 font-bold" :
                      sub.status === "pending" ? "text-yellow-700 font-bold" :
                      "text-red-700 font-bold"
                    }>
                      {sub.status}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-gray-500">{sub.reviewComment}</span>
                  </td>
                  <td>
                    {sub.status === "pending" && (
                      <>
                        <button
                          className="text-green-600 font-bold mr-2"
                          onClick={() => handleReview(sub._id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="text-red-600 font-bold"
                          onClick={() => handleReview(sub._id, "rejected")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default AdminContributer;
