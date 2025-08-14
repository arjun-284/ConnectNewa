import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LogoutButton from "./logout";

/* =========================
   PROFILE DROPDOWN (fixed)
   ========================= */
function ProfileDropdown({
  user,
  onUpdate,
  onPasswordChange,
  onPhotoDelete,
  onClose,
  position, // { top, left, openUp }
}) {
  const [editMode, setEditMode] = useState(false);
  const [pwMode, setPwMode] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    photoUrl: user?.photoUrl || "",
    photoFile: null,
  });
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "" });
  const [previewUrl, setPreviewUrl] = useState(form.photoUrl);
  const fileInput = useRef(null);
  const cardRef = useRef(null);

  // close on click outside / Esc
  useEffect(() => {
    function onDown(e) {
      if (cardRef.current && !cardRef.current.contains(e.target)) onClose?.();
    }
    function onEsc(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  function handleField(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleImage(e) {
    const file = e.target.files?.[0];
    if (file) {
      setForm((f) => ({ ...f, photoFile: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  }
  function handleDeletePhoto() {
    setPreviewUrl("");
    setForm((f) => ({ ...f, photoFile: null, photoUrl: "" }));
    onPhotoDelete?.();
  }
  function handleSave(e) {
    e.preventDefault();
    onUpdate?.(form, () => setEditMode(false));
  }
  function handlePwSubmit(e) {
    e.preventDefault();
    onPasswordChange?.(pwForm, () => setPwMode(false));
    setPwForm({ oldPassword: "", newPassword: "" });
  }

  return (
    <div
      ref={cardRef}
      className="fixed w-80 z-[9999] origin-top-right"
      style={{ top: position.top, left: position.left }}
      role="dialog"
      aria-label="Profile menu"
    >
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl p-5 ring-1 ring-black/5
                      opacity-0 scale-95 animate-[dropdown_160ms_ease-out_forwards]">
        {/* Header */}
        <div className="flex flex-col items-center relative">
          <div className="relative group">
            <img
              src={previewUrl || "https://randomuser.me/api/portraits/men/32.jpg"}
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
              alt="Profile"
              onClick={() => fileInput.current?.click()}
            />
            <input
              type="file"
              ref={fileInput}
              className="hidden"
              accept="image/*"
              onChange={handleImage}
            />
            <div className="absolute -bottom-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="text-xs bg-indigo-600 text-white rounded-full p-1.5 hover:bg-indigo-700 shadow"
                title="Update photo"
                type="button"
                onClick={() => fileInput.current?.click()}
              >
                ✏️
              </button>
              {previewUrl && (
                <button
                  className="text-xs bg-rose-500 text-white rounded-full p-1.5 hover:bg-rose-600 shadow"
                  title="Delete photo"
                  type="button"
                  onClick={handleDeletePhoto}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 text-center">
            <h2 className="text-lg font-bold text-slate-800 truncate max-w-[16rem]">
              {form.name || "Your Name"}
            </h2>
            <p className="text-sm text-slate-500 truncate max-w-[16rem]">
              {form.email || "your@email.com"}
            </p>
          </div>
        </div>

        {/* Edit profile */}
        {editMode ? (
          <form className="mt-4 space-y-2" onSubmit={handleSave}>
            <input
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
              name="name"
              value={form.name}
              onChange={handleField}
              placeholder="Name"
            />
            <input
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
              name="email"
              type="email"
              value={form.email}
              onChange={handleField}
              placeholder="Email"
            />
            <div className="flex justify-between items-center pt-1">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Save
              </button>
              <button
                className="text-slate-500 hover:text-slate-700"
                type="button"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            className="mt-4 w-full bg-indigo-50 text-indigo-700 font-medium py-2 rounded-lg hover:bg-indigo-100"
            onClick={() => setEditMode(true)}
          >
            ✏️ Edit Profile
          </button>
        )}

        {/* Change password */}
        <div className="mt-3">
          {pwMode ? (
            <form className="space-y-2" onSubmit={handlePwSubmit}>
              <input
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                type="password"
                name="oldPassword"
                placeholder="Old Password"
                value={pwForm.oldPassword}
                onChange={(e) =>
                  setPwForm((f) => ({ ...f, oldPassword: e.target.value }))
                }
              />
              <input
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"
                type="password"
                name="newPassword"
                placeholder="New Password"
                value={pwForm.newPassword}
                onChange={(e) =>
                  setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                }
              />
              <div className="flex justify-between items-center pt-1">
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                  Update
                </button>
                <button
                  className="text-slate-500 hover:text-slate-700"
                  type="button"
                  onClick={() => setPwMode(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              className="mt-2 w-full bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 text-sm"
              onClick={() => setPwMode(true)}
            >
              🔒 Change Password
            </button>
          )}
        </div>

        {/* Logout */}
        <div className="mt-4 border-t pt-3">
          <LogoutButton />
        </div>

        <button
          className="text-xs text-slate-400 mt-3 hover:text-slate-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <style>{`
        @keyframes dropdown {
          to { opacity: 1; transform: scale(1); }
          from { opacity: 0; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}

/* =========================
   MAIN NAVIGATION (unique)
   ========================= */
function Navigation() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, openUp: false });
  const avatarBtnRef = useRef(null);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });
  const isLoggedIn = !!user;

  // keep in sync with localStorage changes (e.g., LogoutButton)
  useEffect(() => {
    function onStorage(e) {
      if (e.key === "user") {
        try {
          setUser(JSON.parse(e.newValue));
        } catch {
          setUser(null);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // compute fixed dropdown position (unclippable)
  const toggleDropdown = () => {
    if (!showDropdown) {
      const btn = avatarBtnRef.current;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const MARGIN = 8;
        const W = 320; // w-80
        const H_EST = 420; // estimated height
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < H_EST;

        const top = openUp
          ? Math.max(8, rect.top - H_EST - MARGIN)
          : Math.min(window.innerHeight - H_EST - 8, rect.bottom + MARGIN);

        let left = rect.right - W; // right-align to avatar
        left = Math.max(8, Math.min(left, window.innerWidth - W - 8));
        setDropdownPos({ top, left, openUp });
      }
    }
    setShowDropdown((v) => !v);
  };

  /* ----- update profile (persist to localStorage) ----- */
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  async function handleProfileUpdate(form, done) {
    try {
      let nextPhotoUrl = form.photoUrl ?? user?.photoUrl ?? "";
      if (form.photoFile) {
        // store as base64 data-url
        nextPhotoUrl = await fileToDataUrl(form.photoFile);
      }
      const next = {
        ...user,
        name: form.name?.trim() || user?.name || "",
        email: form.email?.trim() || user?.email || "",
        photoUrl: nextPhotoUrl,
      };
      localStorage.setItem("user", JSON.stringify(next));
      setUser(next);
      alert("Profile updated!");
      done?.();
    } catch (e) {
      console.error(e);
      alert("Error updating profile!");
    }
  }

  async function handlePasswordChange(pwForm, done) {
    // demo only — plug into your backend if available
    if (!pwForm.oldPassword || !pwForm.newPassword) {
      alert("Enter both old and new passwords.");
      return;
    }
    alert("Password updated (demo).");
    done?.();
  }

  function handlePhotoDelete() {
    const next = { ...user, photoUrl: "" };
    localStorage.setItem("user", JSON.stringify(next));
    setUser(next);
    alert("Photo removed.");
  }

  /* ----------------- UI ----------------- */
  const NavItem = ({ to, label, icon }) => (
    <Link to={to}>
      <button className="text-sm font-medium text-slate-700 hover:text-indigo-700 hover:bg-white/50 px-3 py-2 rounded-lg transition">
        <span className="mr-1.5">{icon}</span>
        {label}
      </button>
    </Link>
  );

  return (
    <div className="sticky top-0 z-[1000] overflow-visible">
      {/* gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-indigo-500 animate-[hue_8s_linear_infinite]" />

      {/* glass nav */}
      <div className="backdrop-blur-md bg-white/70 border-b border-white/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          {/* top row */}
          <div className="flex items-center justify-between py-3">
            {/* brand */}
            <Link to="/" className="group flex items-center">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 text-white shadow-md ring-1 ring-black/5">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C8 8 8 16 12 24C16 16 16 8 12 0Z" />
                </svg>
              </span>
              <h1 className="ml-2 text-lg md:text-xl font-extrabold tracking-tight text-slate-800">
                Newa <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-indigo-700">Connect</span>
              </h1>
            </Link>

            {/* right: auth / avatar */}
            <div className="flex items-center gap-2">
              {!isLoggedIn && (
                <>
                  <Link to="/login">
                    <button className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-indigo-700 hover:bg-white/60 transition">
                      Log in
                    </button>
                  </Link>
                  <Link to="/sign">
                    <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition">
                      Sign up
                    </button>
                  </Link>
                </>
              )}

              {isLoggedIn && (
                <button
                  ref={avatarBtnRef}
                  className="focus:outline-none rounded-full ring-0 transition hover:shadow-md hover:-translate-y-0.5 duration-150"
                  onClick={toggleDropdown}
                  title="Profile"
                  aria-haspopup="menu"
                  aria-expanded={showDropdown}
                >
                  <img
                    src={user?.photoUrl || "https://randomuser.me/api/portraits/men/32.jpg"}
                    alt="User"
                    className="w-10 h-10 rounded-full border object-cover"
                  />
                </button>
              )}
            </div>
          </div>

          {/* bottom row: links */}
          <div className="flex flex-wrap gap-2 pb-3">
            <NavItem to="/" label="Home" icon="🏠" />
            <NavItem to="/explore" label="Explore" icon="🧭" />
            <NavItem to="/event" label="Events" icon="🎉" />
            <NavItem to="/community" label="Community" icon="👥" />

            {/* My Tickets — ONLY when logged in */}
            {isLoggedIn && <NavItem to="/my-tickets" label="My Tickets" icon="🎟️" />}

            {/* Role-based dashboards */}
            {isLoggedIn && user?.role === "contributor" && (
              <NavItem to="/contributes" label="Dashboard" icon="🛠️" />
            )}
            {isLoggedIn && user?.role === "admin" && (
              <NavItem to="/admin" label="Dashboard" icon="🧭" />
            )}
            {isLoggedIn && user?.role === "organizer" && (
              <NavItem to="/organizers" label="Dashboard" icon="🗂️" />
            )}
            {isLoggedIn && user?.role === "participate" && (
              <NavItem to="/participate" label="Dashboard" icon="🏃" />
            )}
          </div>
        </div>
      </div>

      {/* render dropdown fixed to viewport (unclipped) */}
      {isLoggedIn && showDropdown && (
        <ProfileDropdown
          user={user}
          onUpdate={handleProfileUpdate}
          onPasswordChange={handlePasswordChange}
          onPhotoDelete={handlePhotoDelete}
          onClose={() => setShowDropdown(false)}
          position={dropdownPos}
        />
      )}

      <style>{`
        @keyframes hue {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Navigation;
