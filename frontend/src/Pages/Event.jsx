import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import Navigation from "../../Components/Navigation";
import { FaUserCircle, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";
import BookTicketModal from "../../Components/BookTicketModal";
import { useNavigate } from "react-router-dom";

// Helper for organizer name caching
const userCache = {};
async function getUserName(id) {
  if (!id) return null;
  if (userCache[id]) return userCache[id];
  try {
    const res = await axios.get(`http://localhost:5000/api/employ/byid/${id}`);
    userCache[id] = res.data.name;
    return res.data.name;
  } catch {
    return null;
  }
}

// Date format (12TH MAY)
function formatEventDate(date) {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const th = (n) =>
    n === 1 || n === 21 || n === 31
      ? "ST"
      : n === 2 || n === 22
      ? "ND"
      : n === 3 || n === 23
      ? "RD"
      : "TH";
  return `${day}${th(day)} ${month}`;
}

export default function Event() {
  const [events, setEvents] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  // Fetch events
  useEffect(() => {
    axios.get("http://localhost:5000/api/events/approved")
      .then(res => setEvents(res.data));
  }, []);

  // Fetch usernames
  useEffect(() => {
    events.forEach(ev => {
      if (ev.createdBy && !userNames[ev._id]) {
        getUserName(ev.createdBy).then(name =>
          setUserNames(prev => ({ ...prev, [ev._id]: name }))
        );
      }
    });
    // eslint-disable-next-line
  }, [events]);

  // Filter logic
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const displayEvents = selectedDate
    ? events.filter(ev =>
        new Date(ev.date).toDateString() === selectedDate.toDateString()
      )
    : events;
  const recentEvents = displayEvents
    .filter(ev => new Date(ev.date) <= now)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const upcomingEvents = displayEvents
    .filter(ev => new Date(ev.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Event card with Book Ticket button and price display
  function EventCard({ ev, badge }) {
    const isUpcoming = badge === "upcoming";
    return (
      <div
        className={`relative group rounded-2xl shadow-lg border transition-transform bg-white flex flex-col
        ${isUpcoming ? "border-[#d2e7e5] hover:shadow-2xl" : "border-[#eed6db]"} 
        hover:scale-[1.025]`}
      >
        <div className="relative">
          {ev.imageUrl && (
            <img
              src={`http://localhost:5000${ev.imageUrl}`}
              alt="event"
              className="w-full h-48 object-cover rounded-t-2xl"
              loading="lazy"
            />
          )}
          <div className={`absolute top-3 left-3 bg-gradient-to-tr from-[#9C1322]/90 to-[#bc6873]/70 px-3 py-1 rounded-full text-white font-bold shadow text-xs tracking-widest z-10`}>
            <FaCalendarAlt className="inline mr-1 -mt-1" />
            {formatEventDate(ev.date)}
          </div>
          {isUpcoming && (
            <div className="absolute top-3 right-3 bg-[#e2f6f4] text-teal-700 font-bold rounded-full px-3 py-1 text-xs shadow">
              UPCOMING
            </div>
          )}
          {!isUpcoming && (
            <div className="absolute top-3 right-3 bg-[#f8e8ea] text-[#9C1322] font-bold rounded-full px-3 py-1 text-xs shadow">
              RECENT
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col px-5 py-4 gap-2">
          <h3 className="text-xl font-extrabold mb-0.5 text-[#223344] line-clamp-2">{ev.title}</h3>
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <FaMapMarkerAlt className="text-[#9C1322]" />
            <span>{ev.location || <span className="text-gray-300">Not specified</span>}</span>
          </div>
          <div className="flex items-center text-sm text-[#223344] gap-2 font-semibold">
            <span>Price:</span>
            <span className="text-[#9C1322]">NPR {ev.price || 0}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 gap-2 mt-0.5">
            <FaUserCircle className="text-[#9C1322] text-lg" />
            <span className="font-semibold text-[#9C1322]">
              {userNames[ev._id] || "Loading..."}
            </span>
          </div>
          <div className="text-gray-700 text-[15px] mt-1 flex-1">
            {ev.description &&
              (ev.description.length > 90 ? (
                <>
                  {expanded[ev._id]
                    ? ev.description
                    : ev.description.slice(0, 90) + "... "}
                  <button
                    className="text-[#9C1322] font-semibold underline ml-1"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [ev._id]: !prev[ev._id],
                      }))
                    }
                  >
                    {expanded[ev._id] ? "See less" : "See more"}
                  </button>
                </>
              ) : (
                ev.description
              ))}
          </div>
          <button
            className="mt-3 bg-[#9C1322] text-white px-4 py-2 rounded font-semibold"
            onClick={() => {
              setSelectedEvent(ev);
              setShowBookModal(true);
            }}
          >
            Book Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="w-full min-h-screen bg-gradient-to-tr from-[#f9f7f5] via-white to-[#f8e8ea]">
        <div className="w-full max-w-7xl mx-auto py-8 px-2 sm:px-6">
          <h1 className="font-extrabold text-4xl md:text-5xl mb-3 text-center text-[#223344] tracking-tight">
            Festivals & Events
          </h1>
          <p className="text-lg text-center text-gray-500 mb-8">
            Discover, browse, and celebrate Newari culture.
          </p>
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Calendar Side */}
            <div className="w-full md:w-1/4 mb-4 md:mb-0">
              <div className="shadow-xl bg-white rounded-2xl p-5 border border-[#d2e7e5]">
                <div className="mb-2 font-semibold text-gray-700 text-sm">
                  Select any date to filter:
                </div>
                <Calendar
                  value={selectedDate}
                  onChange={date => setSelectedDate(date)}
                  className="rounded-lg"
                />
                <div className="flex mt-4 gap-2">
                  {selectedDate && (
                    <button
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded shadow"
                      onClick={() => setSelectedDate(null)}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Events Cards */}
            <div className="flex-1 w-full">
              {/* Upcoming */}
              <h2 className="text-2xl font-bold text-teal-700 mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-teal-400"></span>
                Upcoming Events
              </h2>
              {upcomingEvents.length === 0 ? (
                <div className="text-gray-400 mb-10">No upcoming events.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 mb-12">
                  {upcomingEvents.map(ev => (
                    <EventCard key={ev._id} ev={ev} badge="upcoming" />
                  ))}
                </div>
              )}
              {/* Recent */}
              <h2 className="text-2xl font-bold text-[#9C1322] mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#9C1322]"></span>
                Recent Events
              </h2>
              {recentEvents.length === 0 ? (
                <div className="text-gray-400">No recent events.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                  {recentEvents.map(ev => (
                    <EventCard key={ev._id} ev={ev} badge="recent" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Book Ticket Modal */}
      <BookTicketModal
        show={showBookModal}
        event={selectedEvent}
        onClose={() => setShowBookModal(false)}
        onBooked={ticket => {
          setShowBookModal(false);
          navigate(`/invoice/${ticket._id}`);
        }}
      />
    </>
  );
}
