import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Navigation from "../../Components/Navigation";
import Footer from "../../Components/Footer";

function Admin() {
  const [analyticsOpen, setAnalyticsOpen] = useState(true);   // Organizer
  const [teamOpen, setTeamOpen] = useState(false);            // Management
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <Navigation />

      {/* 
        Make the app frame below the nav take full viewport height and avoid body scrolling:
        - overflow-hidden on wrapper
        - sidebar and main each get overflow-y-auto (independent scrolling)
      */}
      <div className="flex h-screen overflow-hidden bg-[#faf7f7]">
        {/* Sidebar */}
        <aside
          className="
            w-64 bg-[#9C1322] text-white flex flex-col
            shrink-0
            h-full
            overflow-y-auto custom-scroll
            sticky top-0
          "
        >
          {/* Brand */}
          <div className="p-4 border-b border-[#a53d4c] flex items-center gap-3">
            <img
              src="https://tailwindflex.com/images/logo.svg"
              alt="Logo"
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold">Admin Pro</span>
          </div>

          {/* Nav */}
          <nav className="mt-5 px-2 flex-1">
            <div className="space-y-4">

              {/* Dashboard */}
              <Link
                to="/admin"
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive("/admin") ? "bg-white text-[#9C1322]" : "hover:bg-[#B01A2B]"}`}
              >
                Dashboard
              </Link>

              {/* Organizer (Accordion) */}
              <div>
                <button
                  type="button"
                  onClick={() => setAnalyticsOpen((o) => !o)}
                  aria-expanded={analyticsOpen}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition
                    ${analyticsOpen ? "bg-[#B01A2B]/70" : ""} hover:bg-[#B01A2B]`}
                >
                  <span>Organizer</span>
                  <span
                    className={`ml-2 h-5 w-5 transform transition-transform duration-200 ${
                      analyticsOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {analyticsOpen && (
                  <div className="space-y-1 pl-11 mt-1">
                    <Link
                      to="/admin/organizor"
                      className={`block px-3 py-2 text-sm rounded-md
                        ${isActive("/admin/organizor") ? "bg-white text-[#9C1322]" : "hover:bg-[#B01A2B]"}`}
                    >
                      Event Approve/Reject
                    </Link>
                    <Link
                      to="/admin/Approval"
                      className={`block px-3 py-2 text-sm rounded-md
                        ${isActive("/admin/Approval") ? "bg-white text-[#9C1322]" : "hover:bg-[#B01A2B]"}`}
                    >
                      User Approve/Reject
                    </Link>
                  </div>
                )}
              </div>

              {/* Management (Accordion) */}
              <div>
                <button
                  type="button"
                  onClick={() => setTeamOpen((o) => !o)}
                  aria-expanded={teamOpen}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition
                    ${teamOpen ? "bg-[#B01A2B]/70" : ""} hover:bg-[#B01A2B]`}
                >
                  <span>Management</span>
                  <span
                    className={`ml-2 h-5 w-5 transform transition-transform duration-200 ${
                      teamOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {teamOpen && (
                  <div className="space-y-1 pl-11 mt-1">
                    <Link
                      to="/admin/contributorscur"
                      className={`block px-3 py-2 text-sm rounded-md
                        ${isActive("/admin/contributorscur") ? "bg-white text-[#9C1322]" : "hover:bg-[#B01A2B]"}`}
                    >
                      Explore
                    </Link>

                    <Link
                      to="/admin/Users"
                      className={`block px-3 py-2 text-sm rounded-md
                        ${isActive("/admin/Users") ? "bg-white text-[#9C1322]" : "hover:bg-[#B01A2B]"}`}
                    >
                      Users
                    </Link>

                    <Link
                      to="/admin/Exploreadmin"
                      className={`block px-3 py-2 text-sm rounded-md
                        ${isActive("/admin/Exploreadmin") ? "bg-white text-[#9C1322]" : "hover:bg-[#B01A2B]"}`}
                    >
                      Explore (Admin)
                    </Link>

                    <Link
                      to="/admin/amount"
                      className={`block px-3 py-2 text-sm rounded-md
                        ${isActive("/admin/amount") ? "bg-white text-[#9C1322]" : "hover:bg-[#B01A2B]"}`}
                    >
                      Commission
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </nav>
        </aside>

        {/* Main Content (independent scroll) */}
        <main
          className="
            flex-1 h-full overflow-y-auto custom-scroll
            p-6 bg-[#faf7f7]
          "
        >
          <Outlet />
        </main>
      </div>

      <Footer />

      {/* Smooth scroll + pretty scrollbar (works in WebKit/Chromium & Firefox) */}
      <style>{`
        html { scroll-behavior: smooth; }
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: #c7c7c7 transparent;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #cfcfcf;
          border-radius: 8px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #bfbfbf;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </>
  );
}

export default Admin;
