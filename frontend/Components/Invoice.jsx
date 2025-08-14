import React, { useEffect, useState, useRef } from "react";
import Navigation from "../Components/Navigation"; // Import your navigation if needed

// Simple barcode
function Barcode({ code = "" }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-16 my-1">
        {[...code].map((n, i) => (
          <div
            key={i}
            className={`h-full ${parseInt(n) % 2 === 0 ? "w-1 bg-black" : "w-0.5 bg-gray-400"} mx-0.5`}
          />
        ))}
      </div>
      <div className="tracking-widest text-xs">{code}</div>
    </div>
  );
}

export default function Invoice({ ticketId }) {
  const [ticket, setTicket] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Ref for print area
  const printRef = useRef();

  useEffect(() => {
    setLoading(true);
    setNotFound(false);

    fetch(`http://localhost:5000/api/tickets/${ticketId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.ticket) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setTicket(data.ticket);

        // fetch event
        return fetch(`http://localhost:5000/api/events/${data.ticket.event}`)
          .then(res => res.json())
          .then(eventData => {
            if (!eventData || eventData.error) {
              setNotFound(true);
            } else {
              setEvent(eventData);
            }
            setLoading(false);
          });
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [ticketId]);

  if (loading)
    return <div style={{ textAlign: "center", marginTop: "3rem" }}>Loading invoice...</div>;
  if (notFound || !ticket || !event)
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "3rem",
          color: "#9C1322",
        }}
      >
        <b>
          Invoice not found.
          <br />
          Check your ticket link or booking status.
        </b>
      </div>
    );

  // Generate a pseudo ticket number/barcode from ticket._id (for demo)
  const ticketNumber =
    ticket._id?.slice(-9).replace(/[a-z]/g, n => String(n.charCodeAt(0) % 10)) || "012345678";

  // Print handler
  const handlePrint = () => {
    // Only print the ticket area
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=700,width=900');
    printWindow.document.write(`
      <html>
        <head>
          <title>Event Ticket</title>
          <style>
            body { background: #fff6ea; margin: 0; }
            .print-ticket { font-family: sans-serif; }
            @media print {
              body { background: #fff6ea !important; }
              .print-btn, .print-hide { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-ticket">${printContents}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400); // Allow images/styles to load
  };

  return (
    <>
     <Navigation />
    <div className="flex flex-col items-center min-h-screen bg-[#f6f6ee] py-10">
    
      
      <div ref={printRef}>
        <div
          className="w-full max-w-3xl flex bg-[#fff6ea] shadow-2xl rounded-3xl overflow-hidden border border-gray-200"
          style={{ minHeight: "340px" }}
        >
          {/* Left: Image */}
          <div className="w-1/3 min-w-[180px] bg-black flex flex-col justify-center items-center relative">
            <img
              src={event.imageUrl ? `http://localhost:5000${event.imageUrl}` : "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=500&q=80"}
              alt="event"
              className="object-cover w-full h-full"
              style={{ minHeight: "340px" }}
            />
            <div className="absolute top-0 left-0 w-full bg-black/60 text-white p-2 text-xs font-bold tracking-wide">
              EVENT TICKET
            </div>
          </div>
          {/* Right: Details */}
          <div className="w-2/3 px-7 py-7 flex flex-col justify-between relative">
            <div>
              <div className="text-xs uppercase text-gray-500 mb-1">Event</div>
              <div className="text-2xl md:text-3xl font-bold mb-2">{event.title}</div>
              <div className="flex flex-wrap gap-4 items-center mb-3">
                <div>
                  <span className="block text-xs text-gray-500">Venue</span>
                  <span className="font-semibold">{event.location || "Not specified"}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Date</span>
                  <span className="font-semibold">{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Time</span>
                  <span className="font-semibold">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 mb-4">
                <div>
                  <span className="block text-xs text-gray-500">Qty</span>
                  <span className="font-semibold">{ticket.qty}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Total</span>
                  <span className="font-semibold">NPR {ticket.amount}</span>
                </div>
                
                <div>
                  <span className="block text-xs text-gray-500">Status</span>
                  <span className={`font-semibold ${ticket.status === "booked" ? "text-green-700" : "text-red-500"}`}>{ticket.status}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 mb-1">Ticket issued: {new Date(ticket.createdAt).toLocaleString()}</div>
              <div className="text-xs text-gray-400">Ticket Number: <span className="font-bold">{ticketNumber}</span></div>
            </div>
            {/* Barcode and extra info */}
            <div className="flex items-center gap-6 mt-4">
              <div className="w-24">
                <Barcode code={ticketNumber} />
              </div>
              <div className="flex flex-col gap-1 text-xs text-gray-500 pl-4 border-l border-dotted border-gray-300">
                <span><b>Row:</b> 01</span>
                <span><b>Gate:</b> 02</span>
                <span><b>Seat:</b> 03</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
