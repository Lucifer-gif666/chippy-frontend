import React from "react";
import { formatTicketDateTime } from "../utils/dateUtils";

const LastUpdated = ({ date }) => {
  return (
    <div style={{ fontSize: "12px", color: "#999", marginTop: 10 }}>
      Last Updated: {formatTicketDateTime(date)}
    </div>
  );
};

export default LastUpdated;
