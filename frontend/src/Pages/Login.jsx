import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navigation from "../../Components/Navigation";
import Footer from "../../Components/Footer";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

function Login() {
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const navigate = useNavigate();

  // map "participant" -> "participate" (Navigation expects this)
  const normalizeRole = (role) => (role === "participant" ? "participate" : role);

  const saveAndRedirect = (user, token) => {
    // persist
    localStorage.setItem("user", JSON.stringify(user));
    if (token) {
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    // role-based redirect
    const role = user?.role;
    if (role === "admin") navigate("/admin");
    else if (role === "organizer") navigate("/organizers");
    else if (role === "contributor") navigate("/contributes");
    else if (role === "participate") navigate("/participate/performance");
    else navigate("/event");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1) Login
      const res = await axios.post(`${API_BASE}/api/employ/login`, { email, password });
      const { message, user: rawUser, token } = res.data || {};

      if (message !== "Login successful" || !rawUser) {
        setError(res.data?.message || "Login failed.");
        setLoading(false);
        return;
      }

      // 2) Fetch a fresh copy of the user (to include photoUrl, etc.)
      let user = rawUser;
      try {
        const uid = rawUser._id || rawUser.id;
        if (uid) {
          const ures = await axios.get(`${API_BASE}/users/${uid}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          user = ures.data || rawUser;
        }
      } catch {
        // if /users/:id not available, fall back to login payload
      }

      // 3) Normalize role & save
      const normalized = { ...user, role: normalizeRole(user.role) };
      saveAndRedirect(normalized, token);
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid credentials or server error.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <form
        className="max-w-md mx-auto my-10 bg-white p-8 rounded border shadow-sm"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6">Login</h2>

        {error ? (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </div>
        ) : null}

        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          className="w-full mb-4 border p-2 rounded focus:ring-2 focus:ring-indigo-200 outline-none"
          placeholder="you@example.com"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          className="w-full mb-6 border p-2 rounded focus:ring-2 focus:ring-indigo-200 outline-none"
          placeholder="••••••••"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <button
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded font-semibold disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <Footer />
    </>
  );
}

export default Login;
