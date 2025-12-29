// src/pages/AllTickets.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import StaffLayout from "../layout/StaffLayout";
import "../styles/AllTickets.css";
import ExpandableText from "../components/ExpandableText";
import LastUpdated from "../components/LastUpdated";
import ClosedTicketWrapper from "../ReusableComp/ClosedTicketWrapper";

// ✅ API base URL from ENV (Netlify / localhost safe)
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("❌ VITE_API_URL is not defined");
}

const AllTickets = () => {
  const [tickets, setTickets] = useState([]);
  const rowRefs = useRef({});
  const TICKETS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [filterText, setFilterText] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // 🔥 Fetch Tickets (NO localhost)
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
          new Date(`${b.createdDate}T${b.createdTime || "00:00"}`) -
          new Date(`${a.createdDate}T${a.createdTime || "00:00"}`)
      );

      setTickets(sorted);
    } catch (err) {
      console.error("❌ Failed to fetch tickets:", err);
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

  // Helpers
  const normalizeStatus = (s) => (s ? s.toLowerCase().replace(/\s+/g, "-") : "");

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesText = filterText
      ? (t.ticketId || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (t.createdBy || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (t.zoneNo || "").toLowerCase().includes(filterText.toLowerCase())
      : true;

    const matchesZone = filterZone ? t.zoneNo === filterZone : true;
    const matchesPriority = filterPriority ? t.priority === filterPriority.toLowerCase() : true;
    const matchesStatus = filterStatus ? normalizeStatus(t.status) === filterStatus : true;
    const matchesDate = filterDate ? t.createdDate?.startsWith(filterDate) : true;

    return matchesText && matchesZone && matchesPriority && matchesStatus && matchesDate;
  });

  // Dropdown values
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

  // Date / time formatters
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const d = new Date(`1970-01-01T${timeStr}`);
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  return (
    <StaffLayout>
      <h2 className="page-title">All Tickets</h2>

      {/* Filters */}
      <div className="ticket-card-filters">
        <input placeholder="Search by Ticket ID, Creator, Zone..." value={filterText} onChange={(e) => setFilterText(e.target.value)} />
        <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
          <option value="">All Zones</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {statuses.map((s) => <option key={s} value={s}>{s.replace("-", " ")}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        <button className="reset-btn" onClick={() => {
          setFilterText("");
          setFilterZone("");
          setFilterPriority("");
          setFilterStatus("");
          setFilterDate("");
        }}>
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
              ? t.remarks.replace(/on hold/gi, "").split("| Updated:")[0].trim() || "No remarks"
              : "No remarks";
            const updatedRemarks = t.remarks?.includes("| Updated:")
              ? t.remarks.split("| Updated:")[1].trim()
              : "";

            if (t.status === "closed") {
              return (
                <ClosedTicketWrapper key={t._id} status={t.status} ticketId={t.ticketId}>
                  <div className="ticket-card closed-card">
                    <div className="card-body">
                      <div><strong>Created By:</strong> {t.createdBy}</div>
                      <div><strong>Created On:</strong> {formatDate(t.createdDate)} {formatTime(t.createdTime)}</div>
                      <ExpandableText text={remarksMain} maxLength={70} />
                      <LastUpdated date={t.lastUpdated || t.updatedAt || t.createdAt} />
                    </div>
                  </div>
                </ClosedTicketWrapper>
              );
            }

            return (
              <div key={t._id} className={`ticket-card ${isResolved ? "resolved-card" : ""}`}>
                {onHold && <div className="on-hold-ribbon">ON HOLD</div>}
                {isResolved && <div className="resolved-ribbon">RESOLVED</div>}
                <div className="card-body">
                  <div><strong>Ticket:</strong> {t.ticketId}</div>
                  <div><strong>Zone:</strong> {t.zoneNo}</div>
                  <ExpandableText text={remarksMain} maxLength={70} />
                  {updatedRemarks && <ExpandableText text={updatedRemarks} maxLength={70} />}
                  <LastUpdated date={t.lastUpdated || t.updatedAt || t.createdAt} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>Prev</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={currentPage === i + 1 ? "active" : ""} onClick={() => goToPage(i + 1)}>
              {i + 1}
            </button>
          ))}
          <button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>Next</button>
        </div>
      )}
    </StaffLayout>
  );
};

export default AllTickets;
