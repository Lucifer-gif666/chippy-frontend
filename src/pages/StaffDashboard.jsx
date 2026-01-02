// src/pages/StaffDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import StaffLayout from "../layout/StaffLayout";
import "../styles/StaffDashboard.css";
import { formatDate as formatGlobalDate } from "../utils/format";
import ExpandableText from "../components/ExpandableText";
import LastUpdated from "../components/LastUpdated";
import ClosedTicketWrapper from "../ReusableComp/ClosedTicketWrapper";
import { requestFCMToken, onForegroundMessage } from "../firebaseMessaging";





// ✅ API base URL from env (NO localhost hardcode)
const API_BASE_URL = import.meta.env.VITE_API_URL;

const StaffDashboard = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [highlightTicket, setHighlightTicket] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const location = useLocation();
  const rowRefs = useRef({});
  const newTicketId = location.state?.newTicketId || null;

  const formatToDDMMYYYY = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tickets`);
      const selectedDate = currentDate.toISOString().split("T")[0];
      const filteredTickets = res.data.filter((t) =>
        t.createdAt?.startsWith(selectedDate)
      );
      setTickets(filteredTickets);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const initFCM = async () => {
      const jwtToken = localStorage.getItem("token");
  
      if (!jwtToken) {
        console.warn("⚠️ No JWT found, skipping FCM");
        return;
      }
  
      const token = await requestFCMToken();
  
      if (token) {
        console.log("📲 FCM token generated & sent to backend");
      }
    };
  
    initFCM();
  
    onForegroundMessage((payload) => {
      console.log("📩 Foreground notification:", payload);
    });
  }, []);
  


  useEffect(() => {
    fetchTickets();

    if (location.state?.refresh && location.state?.newTicketId) {
      setHighlightTicket(location.state.newTicketId);
      setTimeout(() => setHighlightTicket(null), 5000);
    }
  }, [location.state, currentDate]);

  useEffect(() => {
    const handleTicketsUpdate = () => fetchTickets();
    window.addEventListener("tickets-updated", handleTicketsUpdate);
    return () =>
      window.removeEventListener("tickets-updated", handleTicketsUpdate);
  }, []);

  const pendingCount = tickets.filter((t) => t.status === "Pending").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;
  const closedCount = tickets.filter((t) => t.status === "Closed").length;

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const TicketTable = ({ tickets, highlightTicket }) => {
    const [filterText, setFilterText] = useState("");
    const [filterZone, setFilterZone] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterPriority, setFilterPriority] = useState("");

    useEffect(() => {
      if (highlightTicket && rowRefs.current[highlightTicket]) {
        rowRefs.current[highlightTicket].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, [highlightTicket]);

    const normalizeStatus = (s) => (s ? s.toLowerCase() : "");

    const zones = [...new Set(tickets.map((t) => t.zoneNo))];
    const statuses = [...new Set(tickets.map((t) => normalizeStatus(t.status)))];
    const priorities = [
      ...new Set(
        tickets
          .map((t) => t.priority?.toLowerCase())
          .filter(Boolean)
      ),
    ];

    const filteredTickets = tickets.filter((t) => {
      const matchSearch =
        t.ticketId.toLowerCase().includes(filterText.toLowerCase()) ||
        t.createdBy.toLowerCase().includes(filterText.toLowerCase()) ||
        t.zoneNo.toLowerCase().includes(filterText.toLowerCase());

      const matchZone = filterZone ? t.zoneNo === filterZone : true;
      const matchStatus = filterStatus ? normalizeStatus(t.status) === normalizeStatus(filterStatus) : true;
      const matchPriority = filterPriority ? t.priority?.toLowerCase() === filterPriority : true;

      return matchSearch && matchZone && matchStatus && matchPriority;
    });

    const formatTime = (dateStr) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };
    

    return (
      <div className="ticket-card-wrapper">
        <div className="ticket-card-filters">
          <input
            type="text"
            placeholder="Search by Ticket ID, Creator, Zone..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />

          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
          >
            <option value="">All Zones</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>

            <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

        

          <button
            className="reset-btn"
            onClick={() => {
              setFilterText("");
              setFilterZone("");
              setFilterStatus("");
              setFilterPriority("");
            }}
          >
            Reset Filters
          </button>
        </div>

        <div className="ticket-card-grid">
          {filteredTickets.map((t) => {
            const onHold = t.remarks?.toLowerCase().includes("on hold");
            const isResolved = t.status === "Resolved";

            const remarksMain = t.remarks
              ? t.remarks
                  .replace(/on hold/gi, "")
                  .replace(/\s\s+/g, " ")
                  .split("| Updated:")[0]
                  .trim() || "No remarks"
              : "No remarks";

            const updatedRemarks =
              t.remarks && t.remarks.includes("| Updated:")
                ? t.remarks.split("| Updated:")[1].trim()
                : "";

            const cardClass = isResolved
              ? "resolved-card"
              : onHold && t.status === "In Progress"
              ? "on-hold-card"
              : "";

            return (
              <ClosedTicketWrapper key={t._id} status={t.status} ticketId={t.ticketId}>
                <div
  ref={(el) => (rowRefs.current[t.ticketId] = el)}
  className={`ticket-card ${cardClass} ${
    highlightTicket === t.ticketId ? "new-ticket-highlight" : ""
  }`}
>


                  {onHold && t.status === "In Progress" && (
                    <div className="on-hold-ribbon">ON HOLD</div>
                  )}
                  {isResolved && <div className="resolved-ribbon">RESOLVED</div>}

                 <div className="card-header">
  {/* Top row */}
  <div className="header-top">
    <span
      className={`badge status-${normalizeStatus(t.status).replace(" ", "-")}`}
    >
      {t.status}
    </span>

    <span className={`badge ${t.priority?.toLowerCase() || "low"}`}>
      {t.priority}
    </span>
  </div>

  {/* Second row */}
  <div className="header-bottom">
    <span className="ticket-icon">🎫</span>
    <span className="ticket-id">{t.ticketId}</span>
  </div>
</div>


                  <div className="card-body">
                    <div><strong>Created By:</strong> {t.createdBy}</div>
                    <div>
                      <strong>Created On:</strong> {formatToDDMMYYYY(t.createdAt)} {formatTime(t.createdTime)}
                    </div>
                    <div><strong>Zone:</strong> {t.zoneNo}</div>
                    <div><strong>Apartment:</strong> {t.apartmentName}</div>
                    <div><strong>Room:</strong> {t.roomNo}</div>

                    <div className="remarks-wrapper" style={{ marginTop: 6 }}>
                      <strong>Remarks:</strong> <ExpandableText text={remarksMain} maxLength={70} />
                    </div>

                    {t.assignedTo && (
                      <div className="assigned-badge" style={{ marginTop: 6 }}>
                        <strong>Assigned To:</strong> {t.assignedTo}
                      </div>
                    )}

                    {updatedRemarks && (
                      <div className="updated-remarks" style={{ marginTop: 6 }}>
                        <strong>Updated Remarks:</strong> <ExpandableText text={updatedRemarks} maxLength={70} />
                      </div>
                    )}

                    <LastUpdated
                      date={//t.lastUpdated || 
                        t.updatedAt || 
                        //t.createdAt || 
                        t.createdAt}
                    />
                  </div>
                </div>
              </ClosedTicketWrapper>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <StaffLayout>
      <div>
        <div className="cards">
          <div className="card pending">
            <div>Pending</div>
            <div className="count">{pendingCount}</div>
          </div>
          <div className="card in-progress">
            <div>In Progress</div>
            <div className="count">{inProgressCount}</div>
          </div>
          <div className="card resolved">
            <div>Resolved</div>
            <div className="count">{resolvedCount}</div>
          </div>
          <div className="card closed">
            <div>Closed</div>
            <div className="count">{closedCount}</div>
          </div>
        </div>

        <div className="date-navigation">
          <button onClick={() => changeDate(-1)}>← Previous Day</button>
          <span
            style={{ cursor: "pointer", fontWeight: "bold" }}
            onClick={() => document.getElementById("dashboard-date-picker").showPicker()}
          >
            {formatGlobalDate(currentDate.toISOString())}
          </span>
          <input
            type="date"
            id="dashboard-date-picker"
            style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
            value={currentDate.toISOString().split("T")[0]}
            onChange={(e) => {
  if (e.target.value) {
    setCurrentDate(new Date(e.target.value));
  } else {
    setCurrentDate(new Date()); // fallback to today
  }
}}

          />
          <button
            onClick={() => changeDate(1)}
            disabled={currentDate.toDateString() === new Date().toDateString()}
          >
            Next Day →
          </button>
        </div>

        <TicketTable tickets={tickets} highlightTicket={highlightTicket} />
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
