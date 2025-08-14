import React, { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Navigation from "../../Components/Navigation";
import Footer from "../../Components/Footer";

/* read user from localStorage and normalize id */
function getUser() {
  try {
    const raw = localStorage.getItem("user");
    const u = raw ? JSON.parse(raw) : {};
    if (u && !u._id && u.id) u._id = u.id;
    return u || {};
  } catch {
    return {};
  }
}

export default function ParticipateDashboard() {
  const user = useMemo(() => getUser(), []);
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (p) => pathname === p || pathname.startsWith(p + "/");

  return (
    <>
      <Navigation />

      <div className="min-h-screen flex bg-[#F6F1F1]">
        {/* Sidebar */}
        <aside
          className={`
            fixed z-30 inset-y-0 left-0 bg-[#9C1322] text-white w-64 transform transition-transform
            ${sidebarOpen ? "translate-x-0" : "-translate-x-64"}
            md:relative md:translate-x-0 md:w-60
            flex flex-col py-6 shadow-2xl
          `}
          style={{ borderTopRightRadius: 36, borderBottomRightRadius: 36 }}
        >
          {/* close on mobile */}
          <button
            className="absolute top-4 right-4 md:hidden text-white"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✖
          </button>

          {/* User block */}
          <div className="flex flex-col items-center mb-10 px-4">
            <div className="bg-white text-[#9C1322] rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold border-2 border-[#FFD700] shadow mb-3 select-none">
              {(user.name || "P").charAt(0).toUpperCase()}
            </div>
            <div className="text-lg font-bold truncate max-w-[180px]">
              {user.name || "Participant"}
            </div>
            <div className="text-xs text-gray-200 truncate max-w-[180px]">
              {user.email || ""}
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-5 space-y-2">
            <Link
              to="/participate/performance"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive("/participate/performance")
                  ? "bg-white text-[#9C1322] shadow"
                  : "hover:bg-[#FFD700] hover:text-[#9C1322]"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <span>🎤</span>
              <span>Performance Dashboard</span>
            </Link>

            <Link
              to="/participate/competitor"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive("/participate/competitor")
                  ? "bg-white text-[#9C1322] shadow"
                  : "hover:bg-[#FFD700] hover:text-[#9C1322]"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <span>🏆</span>
              <span>Competitor</span>
            </Link>
          </nav>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main */}
        <main className="flex-1 p-4 md:p-10">
          {/* mobile header */}
          <div className="flex md:hidden items-center mb-6">
            <button
              className="text-3xl text-[#9C1322] mr-4"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              ☰
            </button>
            <span className="text-2xl font-extrabold text-[#9C1322]">
              Participate Dashboard
            </span>
          </div>

          {/* page header (desktop hint) */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#9C1322]">Participate Dashboard</h1>
            <p className="text-gray-500">Manage your performances and competitor profile.</p>
          </div>

          <Outlet />
        </main>
      </div>

      <Footer />
    </>
  );
}
