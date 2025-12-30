// src/pages/AllTickets.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import StaffLayout from "../layout/StaffLayout";
import "../styles/AllTickets.css";
import ExpandableText from "../components/ExpandableText";
import LastUpdated from "../components/LastUpdated";
import ClosedTicketWrapper from "../ReusableComp/ClosedTicketWrapper";

// ✅ API base URL from env (NO localhost hardcode)
const API_BASE_URL = import.meta.env.VITE_API_URL;

const AllTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [highlightTicket, setHighlightTicket] = useState(null);
  const rowRefs = useRef({});
  const TICKETS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [filterText, setFilterText] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Fetch Tickets
  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tickets`);
      const normalized = Array.isArray(res.data)
        ? res.data.map((t) => ({
            ...t,
            status: t.status?.toLowerCase(),
            priority: t.priority?.toLowerCase(),
          }))
        : [];
      const sorted = normalized.sort(
        (a, b) =>
          new Date(`${b.createdAt}T${b.createdTime || "00:00"}`) -
          new Date(`${a.createdAt}T${a.createdTime || "00:00"}`)
      );
      setTickets(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    const handleTicketsUpdate = () => fetchTickets();
    window.addEventListener("tickets-updated", handleTicketsUpdate);
    return () => window.removeEventListener("tickets-updated", handleTicketsUpdate);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, filterZone, filterPriority, filterStatus, filterDate]);

  // Normalize status for dropdown
  const normalizeStatus = (s) => (s ? s.toLowerCase().replace(/\s+/g, "-") : "");

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesText = filterText
      ? (t.ticketId || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (t.createdBy || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (t.zoneNo || "").toLowerCase().includes(filterText.toLowerCase())
      : true;
    const matchesZone = filterZone ? t.zoneNo === filterZone : true;
    const matchesPriority = filterPriority ? t.priority === filterPriority.toLowerCase() : true;
    const matchesStatus = filterStatus ? normalizeStatus(t.status) === filterStatus : true;
    const matchesDate = filterDate ? t.createdAt?.startsWith(filterDate) : true;
    return matchesText && matchesZone && matchesPriority && matchesStatus && matchesDate;
  });

  // Dynamic dropdown options
  const zones = [...new Set(filteredTickets.map((t) => t.zoneNo).filter(Boolean))];
  const priorities = [...new Set(filteredTickets.map((t) => t.priority).filter(Boolean))];
  const statuses = [...new Set(filteredTickets.map((t) => normalizeStatus(t.status)).filter(Boolean))];

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / TICKETS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * TICKETS_PER_PAGE,
    currentPage * TICKETS_PER_PAGE
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

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
    <StaffLayout>
      <h2 className="page-title">All Tickets</h2>

      <div className="ticket-card-filters">
        <input
          placeholder="Search by Ticket ID, Creator, Zone..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
          <option value="">All Zones</option>
          {zones.map((zone) => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {priorities.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s.replace("-", " ")}</option>
          ))}
        </select>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        <button
          className="reset-btn"
          onClick={() => {
            setFilterText("");
            setFilterZone("");
            setFilterPriority("");
            setFilterStatus("");
            setFilterDate("");
          }}
        >
          Reset Filters
        </button>
      </div>

      {/* Tickets */}
      <div className="ticket-card-grid">
        {paginatedTickets.length === 0 ? (
          <p>No tickets found.</p>
        ) : (
          paginatedTickets.map((t) => {
            const onHold = t.remarks?.toLowerCase().includes("on hold");
            const isResolved = t.status === "resolved";
            const remarksMain = t.remarks
              ? t.remarks.replace(/on hold/gi, "").replace(/\s\s+/g, " ").split("| Updated:")[0].trim() || "No remarks"
              : "No remarks";
            const updatedRemarks =
              t.remarks && t.remarks.includes("| Updated:")
                ? t.remarks.split("| Updated:")[1].trim()
                : "";

            if (t.status === "closed") {
              return (
                <ClosedTicketWrapper key={t._id} status={t.status} ticketId={t.ticketId}>
                  <div className="ticket-card closed-card">
                    <div className="card-header">
                      <div className="header-top">
                        <span className={`badge status-${t.status}`}>{normalizeStatus(t.status)}</span>
                        <span className={`badge ${t.priority?.toLowerCase() || "low"}`}>{t.priority}</span>
                      </div>
                      <div className="header-bottom">
                        <span className="ticket-icon">🎫</span>
                        <span className="ticket-id">{t.ticketId}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div><strong>Created By:</strong> {t.createdBy}</div>
                      <div><strong>Created On:</strong> {formatDate(t.createdAt)} {formatTime(t.createdAt)}</div>
                      <div><strong>Zone:</strong> {t.zoneNo}</div>
                      <div><strong>Apartment:</strong> {t.apartmentName}</div>
                      <div><strong>Room:</strong> {t.roomNo}</div>
                      <div className="remarks-wrapper" style={{ marginTop: 6 }}>
                        <strong>Remarks:</strong> <ExpandableText text={remarksMain} maxLength={70} />
                      </div>
                      {t.assignedTo && <div className="assigned-badge"><strong>Assigned To:</strong> {t.assignedTo}</div>}
                      {updatedRemarks && <div className="updated-remarks"><strong>Updated Remarks:</strong> <ExpandableText text={updatedRemarks} maxLength={70} /></div>}
                      <LastUpdated date={//t.lastUpdated || 
                      t.updatedAt //|| t.createdAt 
                      || t.createdAt} />
                    </div>
                  </div>
                </ClosedTicketWrapper>
              );
            }

            return (
              <div className={`ticket-card ${isResolved ? "resolved-card" : ""}`} key={t._id}>
                {onHold && <div className="on-hold-ribbon">ON HOLD</div>}
                {isResolved && <div className="resolved-ribbon">RESOLVED</div>}
                <div className="card-header">
                  <div className="header-top">
                    <span className={`badge status-${t.status}`}>{normalizeStatus(t.status)}</span>
                    <span className={`badge ${t.priority?.toLowerCase() || "low"}`}>{t.priority}</span>
                  </div>
                  <div className="header-bottom">
                    <span className="ticket-icon">🎫</span>
                    <span className="ticket-id">{t.ticketId}</span>
                  </div>
                </div>
                <div className="card-body">
                  <div><strong>Created By:</strong> {t.createdBy}</div>
                  <div><strong>Created On:</strong> {formatDate(t.createdAt)} {formatTime(t.createdTime)}</div>
                  <div><strong>Zone:</strong> {t.zoneNo}</div>
                  <div><strong>Apartment:</strong> {t.apartmentName}</div>
                  <div><strong>Room:</strong> {t.roomNo}</div>
                  <div className="remarks-wrapper" style={{ marginTop: 6 }}>
                    <strong>Remarks:</strong> <ExpandableText text={remarksMain} maxLength={70} />
                  </div>
                  {t.assignedTo && <div className="assigned-badge"><strong>Assigned To:</strong> {t.assignedTo}</div>}
                  {updatedRemarks && <div className="updated-remarks"><strong>Updated Remarks:</strong> <ExpandableText text={updatedRemarks} maxLength={70} /></div>}
                  <LastUpdated date={//t.lastUpdated || 
                    t.updatedAt || 
                    //t.createdAt || 
                    t.createdAt} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-wrapper">
          <div className="pagination">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              &lt; Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button key={num} className={num === currentPage ? "active" : ""} onClick={() => goToPage(num)}>
                {num}
              </button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next &gt;
            </button>
          </div>
        </div>
      )}
    </StaffLayout>
  );
};

export default AllTickets;
