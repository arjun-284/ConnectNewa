import React from "react";
import Invoice from "../../Components/Invoice";
import { useParams } from "react-router-dom";

export default function InvoicePage() {
  const { ticketId } = useParams();
  return (
    <div>
      <Invoice ticketId={ticketId} />
    </div>
  );
}
