import React, { useEffect, useMemo, useState } from "react";

/* ---- point this to your backend ---- */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const authHeaders = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

/* Always return a stable string id */
const idStr = (u) => String(u?.id ?? u?._id ?? "");

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(opts.headers || {}),
    },
    ...opts,
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data?.error || data?.message || `${res.status}`);
  return data;
}

export default function List() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // edit state (name/email only)
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", email: "" });
  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true); setErr("");
    try {
      const data = await api("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load users");
      setUsers([]);
    } finally { setLoading(false); }
  }

  function startEdit(u) {
    setEditingId(idStr(u));
    setDraft({ name: u.name || "", email: u.email || "" });
  }
  function cancelEdit() {
    setEditingId(null);
    setSavingId(null);
    setDraft({ name: "", email: "" });
  }

  async function saveEdit(id) {
    const idS = String(id);
    if (!draft.name || !draft.email) {
      setErr("Name and email are required.");
      return;
    }
    setErr("");
    setSavingId(idS);

    // optimistic update + immediately exit edit mode (feel fast)
    setUsers((prev) =>
      prev.map((u) =>
        idStr(u) === idS ? { ...u, name: draft.name, email: draft.email } : u
      )
    );
    cancelEdit();

    try {
      // PATCH; if your server only supports PUT, it is easy to swap
      const updated = await api(`/users/${idS}`, {
        method: "PATCH",
        body: JSON.stringify({ name: draft.name, email: draft.email }),
      });
      // ensure we merge whatever server returns
      setUsers((prev) => prev.map((u) => (idStr(u) === idS ? updated : u)));
    } catch (e) {
      setErr(e.message || "Failed to update user");
      // bring server truth back
      loadUsers();
    } finally {
      setSavingId(null);
    }
  }

  async function deleteUser(u) {
    const idS = idStr(u);
    if (!idS) return;
    if (!confirm(`Delete ${u.name || "this user"}?`)) return;

    const prev = users;
    setUsers((p) => p.filter((x) => idStr(x) !== idS));
    setErr("");
    try {
      await api(`/users/${idS}`, { method: "DELETE" });
    } catch (e) {
      setErr(e.message || "Failed to delete user");
      setUsers(prev);
    }
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">User List</h1>
        <button className="text-sm px-3 py-1 rounded border hover:bg-gray-50" onClick={loadUsers}>
          Refresh
        </button>
      </div>

      {err && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">
          {err}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Email</th>
                <th className="py-2 px-4 border-b text-left">Role</th>
                <th className="py-2 px-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const idS = idStr(u);                 // <- stable string id
                const active = editingId === idS;
                return (
                  <tr key={idS || u.email || Math.random()} className="align-top">
                    <td className="py-2 px-4 border-b">
                      {active ? (
                        <input
                          className="border rounded px-2 py-1 w-full"
                          value={draft.name}
                          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        />
                      ) : (
                        u.name
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {active ? (
                        <input
                          className="border rounded px-2 py-1 w-full"
                          type="email"
                          value={draft.email}
                          onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                        />
                      ) : (
                        u.email
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100">
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b text-right">
                      {active ? (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => saveEdit(idS)}
                            className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
                          >
                            {savingId === idS ? "Saving..." : "Save"}
                          </button>
                          <button onClick={cancelEdit} className="px-3 py-1 rounded border text-sm">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => startEdit(u)}
                            className="px-3 py-1 rounded border text-sm hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteUser(u)}
                            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
