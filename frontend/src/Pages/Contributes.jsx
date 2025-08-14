import React, { useEffect, useState } from "react";
import Navigation from "../../Components/Navigation";
import axios from "axios";

function Contributes() {
  const [mySubs, setMySubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  // Sidebar state: 'dashboard' | 'mysubmissions' | 'contribute'
  const [section, setSection] = useState("dashboard");

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState(null);

  // For edit mode
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    setError("");
    axios
      .get(`http://localhost:5000/api/contributors/byuser/${user._id}`)
      .then((res) => setMySubs(res.data))
      .catch(() => setError("Failed to fetch your submissions."))
      .finally(() => setLoading(false));
  }, [user?._id]);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/contributors/byuser/${user._id}`
      );
      setMySubs(data);
    } catch {
      setError("Failed to fetch your submissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !body) return alert("Title and body are required!");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("body", body);
    formData.append("submittedBy", user._id);
    if (media) formData.append("media", media);

    try {
      if (editId) {
        await axios.patch(
          `http://localhost:5000/api/contributors/edit/${editId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" }
          }
        );
      } else {
        await axios.post(
          "http://localhost:5000/api/contributors/submit",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" }
          }
        );
      }
      setTitle("");
      setBody("");
      setMedia(null);
      setEditId(null);
      await fetchSubs();
      setSection("mysubmissions"); // Switch to submissions after submit/update
    } catch (e) {
      setError("Failed to submit.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this submission?")) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/contributors/delete/${id}`,
        {
          data: { submittedBy: user._id }
        }
      );
      await fetchSubs();
    } catch {
      setError("Failed to delete submission.");
    }
  };

  const handleEditLoad = (sub) => {
    setEditId(sub._id);
    setTitle(sub.title);
    setBody(sub.body);
    setMedia(null);
    setSection("contribute"); // Jump to contribute tab in edit mode
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditId(null);
    setTitle("");
    setBody("");
    setMedia(null);
  };

  // Stats
  const stats = [
    {
      label: "Total",
      value: mySubs.length,
      color: "text-[#9C1322]"
    },
    {
      label: "Approved",
      value: mySubs.filter((x) => x.status === "approved").length,
      color: "text-green-700"
    },
    {
      label: "Pending",
      value: mySubs.filter((x) => x.status === "pending").length,
      color: "text-yellow-600"
    },
    {
      label: "Rejected",
      value: mySubs.filter((x) => x.status === "rejected").length,
      color: "text-red-700"
    }
  ];

  // Approved list (for dashboard)
  const approvedSubs = mySubs.filter((x) => x.status === "approved");

  return (
    <>
      <Navigation />
      <div className="flex bg-[#f8f6f7] min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-[#9C1322] flex flex-col items-center py-8 shadow-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-[#9C1322] border-4 border-white mb-2 shadow">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="text-white font-bold text-lg">{user?.name || "User"}</div>
            <div className="text-white text-sm opacity-80">{user?.email || ""}</div>
          </div>
          <nav className="flex flex-col gap-2 w-full px-6">
            <button
              className={`flex items-center gap-2 py-2 px-4 rounded font-semibold transition ${
                section === "dashboard"
                  ? "bg-white/20 text-white"
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => setSection("dashboard")}
            >
              <span role="img" aria-label="Dashboard">🏠</span> Dashboard
            </button>
            <button
              className={`flex items-center gap-2 py-2 px-4 rounded font-semibold transition ${
                section === "mysubmissions"
                  ? "bg-white/20 text-white"
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => setSection("mysubmissions")}
            >
              <span role="img" aria-label="Submissions">📚</span> My Submissions
            </button>
            <button
              className={`flex items-center gap-2 py-2 px-4 rounded font-semibold transition ${
                section === "contribute"
                  ? "bg-white/20 text-white"
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => {
                setSection("contribute");
                cancelEdit();
              }}
            >
              <span role="img" aria-label="Contribute">✍️</span> Contribute
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-8 py-8">
          {/* Dashboard Section */}
          {section === "dashboard" && (
            <>
              <h1 className="text-3xl font-bold text-[#9C1322] mb-1">Contributor Dashboard</h1>
              <p className="text-gray-600 mb-4">Manage your content and view your stats.</p>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-xl border shadow p-6 flex flex-col items-center"
                  >
                    <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                    <span className="mt-2 text-gray-600 text-sm font-medium">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
              {/* Approved Submissions List (optional) */}
              <section className="bg-white rounded-xl border shadow p-6 max-w-3xl mx-auto">
                <h2 className="text-xl font-bold text-[#9C1322] mb-4">Approved Contributions</h2>
                {approvedSubs.length === 0 ? (
                  <div className="text-gray-500">No approved submissions yet.</div>
                ) : (
                  <div className="space-y-4">
                    {approvedSubs.map((sub) => (
                      <div key={sub._id} className="bg-gray-50 p-4 rounded-lg shadow flex flex-col gap-2 border">
                        <div className="font-bold text-lg text-gray-800">{sub.title}</div>
                        <div className="text-sm text-gray-700 whitespace-pre-line line-clamp-4">
                          {sub.body}
                        </div>
                        {sub.mediaUrl && (
                          <img
                            src={`http://localhost:5000${sub.mediaUrl}`}
                            className="w-full h-48 object-cover mt-2 rounded-lg border"
                            alt="Media"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {/* My Submissions Section */}
          {section === "mysubmissions" && (
            <section className="bg-white rounded-xl border shadow p-6 max-w-3xl mx-auto">
              <h2 className="text-xl font-bold text-[#9C1322] mb-4">My Submissions</h2>
              {loading ? (
                <div>⏳ Loading...</div>
              ) : mySubs.length === 0 ? (
                <div className="text-gray-500">You haven’t submitted anything yet.</div>
              ) : (
                <div className="space-y-4">
                  {mySubs.map((sub) => (
                    <div
                      key={sub._id}
                      className="bg-gray-50 p-4 rounded-lg shadow flex flex-col gap-2 border"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-lg text-gray-800">{sub.title}</div>
                        <span
                          className={
                            "px-3 py-1 rounded-full text-xs font-bold uppercase " +
                            (sub.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : sub.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700")
                          }
                        >
                          {sub.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-line line-clamp-4">
                        {sub.body}
                      </div>
                      {sub.mediaUrl && (
                        <img
                          src={`http://localhost:5000${sub.mediaUrl}`}
                          className="w-full h-48 object-cover mt-2 rounded-lg border"
                          alt="Media"
                        />
                      )}
                      <div className="flex justify-end gap-3 mt-2">
                        <button
                          className="px-4 py-1 text-sm rounded-md bg-yellow-100 hover:bg-yellow-200 text-yellow-900 font-medium transition-all"
                          onClick={() => handleEditLoad(sub)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="px-4 py-1 text-sm rounded-md bg-red-100 hover:bg-red-200 text-red-800 font-medium transition-all"
                          onClick={() => handleDelete(sub._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Contribute Section */}
          {section === "contribute" && (
            <section className="bg-white rounded-xl border shadow p-6 mb-10 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold text-[#9C1322] mb-4">
                {editId ? "Edit Contribution" : "Create New Contribution"}
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow mb-4">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#9C1322]"
                  value={title}
                  placeholder="📝 Title of your content"
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <textarea
                  className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#9C1322]"
                  value={body}
                  placeholder="💬 Write your content here..."
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  required
                />
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setMedia(e.target.files[0])}
                  className="block text-sm text-gray-500"
                />
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-[#9C1322] hover:bg-[#7d101b] text-white px-6 py-2 rounded-md font-semibold transition-all"
                  >
                    {editId ? "✅ Update" : "🚀 Submit"}
                  </button>
                  {editId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-6 py-2 rounded-md border font-semibold text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      ❌ Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

export default Contributes;
