import { useState } from "react";
import axios from "axios";
import Navigation from "../../Components/Navigation";
import Footer from "../../Components/Footer";
import { useNavigate } from "react-router-dom";

function Sign() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",                // user | organizer | contributor | participant
    competitionType: "",         // food | dance | music | art | other
    teamName: "",                // optional
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setApiError("");
  };

  const validate = () => {
    if (form.password !== form.confirmPassword) {
      setApiError("Passwords do not match.");
      return false;
    }
    if (form.password.length < 6) {
      setApiError("Password should be at least 6 characters.");
      return false;
    }
    // Participant का लागि competition अनिवार्य
    if (form.role === "participant" && !form.competitionType) {
      setApiError("Please select your competition type.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");

    const endpoint = "http://localhost:5000/api/employ/register";

    // backend मा पठिने payload
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      // competitionType/teamName सबै role मा पठाइयो (backend ignore गरे पनि OK)
      competitionType: form.competitionType || null,
      teamName: form.teamName?.trim() || null,
    };

    try {
      await axios.post(endpoint, payload);
      alert("Account created successfully!");
      navigate("/login");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error creating account.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isParticipant = form.role === "participant";

  return (
    <>
      <Navigation />

      <form
        className="max-w-md mx-auto my-10 bg-white p-8 rounded-2xl shadow-sm border"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-1">Create an Account</h2>
        <p className="text-sm text-gray-500 mb-6">
          Sign up to participate or manage events.
        </p>

        {/* Name */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          className="w-full mb-3 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
          placeholder="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        {/* Email */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          className="w-full mb-3 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
          placeholder="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        {/* Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Min 6 characters recommended.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="Confirm Password"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Role */}
        <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
          Account Type
        </label>
        <select
          className="w-full mb-3 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white"
          name="role"
          value={form.role}
          onChange={handleChange}
        >
          <option value="user">User</option>
          <option value="organizer">Organizer</option>
          <option value="contributor">Contributor</option>
          <option value="participant">Participant</option>
        </select>

        {/* Competition fields (visible when role === participant) */}
        {isParticipant && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Competition Type
            </label>
            <select
              className="w-full mb-3 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white"
              name="competitionType"
              value={form.competitionType}
              onChange={handleChange}
              required={isParticipant}
            >
              <option value="">Select Competition</option>
              <option value="food">Food</option>
              <option value="dance">Dance</option>
              <option value="music">Music</option>
              <option value="art">Art</option>
              <option value="other">Other</option>
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team / Stage Name (optional)
            </label>
            <input
              className="w-full mb-3 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="e.g., Bhaktapur Bites / The Groove Crew"
              name="teamName"
              value={form.teamName}
              onChange={handleChange}
            />
          </>
        )}

        {/* API error */}
        {apiError && (
          <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">
            {apiError}
          </div>
        )}

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="text-xs text-gray-500 mt-3">
          By signing up, you agree to our Terms & Privacy.
        </p>
      </form>

      <Footer />
    </>
  );
}
export default Sign;
