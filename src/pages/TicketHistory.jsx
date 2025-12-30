// src/pages/TicketHistory.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import StaffLayout from "../layout/StaffLayout";
import ExpandableText from "../components/ExpandableText";
import LastUpdated from "../components/LastUpdated";
import "../styles/TicketHistory.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClosedTicketWrapper from "../ReusableComp/ClosedTicketWrapper";
import { showBrowserNotification } from "../utils/browserNotifications";



// ✅ API base URL from env (NO localhost hardcode)
const API_BASE_URL = import.meta.env.VITE_API_URL;


const TicketHistory = () => {
  const rawStaff = localStorage.getItem("currentStaff");
  const currentStaff = rawStaff ? JSON.parse(rawStaff) : null;

  const [activeTab, setActiveTab] = useState(
    currentStaff?.role === "admin" ? "pendingClosure" : "closed"
  );

  const [tickets, setTickets] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [loadingTickets, setLoadingTickets] = useState({});
  const [page, setPage] = useState(1);
  const TICKETS_PER_PAGE = 12;

  const extractId = (val) => {
    if (!val && val !== 0) return null;
    if (typeof val === "string") return val;
    if (val.$oid) return val.$oid;
    if (val.$id) return val.$id;
    if (val._id) return extractId(val._id);
    if (typeof val === "object") {
      for (const v of Object.values(val)) {
        const found = extractId(v);
        if (found) return found;
      }
    }
    return null;
  };

  const staffId = extractId(currentStaff && currentStaff._id ? currentStaff._id : currentStaff);

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
      setTickets(normalized);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch tickets!");
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, filterText, filterZone, filterPriority, filterStatus, filterDate]);

  const normalizeStatus = (status) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s.includes("pending")) return "Pending";
    if (s.includes("in progress")) return "In Progress";
    if (s.includes("resolved")) return "Resolved";
    if (s.includes("closed")) return "Closed";
    return status;
  };

  const formatToDDMMYYYY = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const ticketsForActiveTab = tickets.filter((t) => {
    if (activeTab === "pendingClosure") return normalizeStatus(t.status) === "Resolved";
    if (activeTab === "closed") return normalizeStatus(t.status) === "Closed";
    return true;
  });

  const filteredTickets = () =>
    ticketsForActiveTab.filter((t) => {
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

  const filteredList = filteredTickets();

  const zones = [...new Set(filteredList.map((t) => t.zoneNo).filter(Boolean))];
  const priorities = [...new Set(filteredList.map((t) => t.priority).filter(Boolean))];
  const statuses = [...new Set(filteredList.map((t) => normalizeStatus(t.status)).filter(Boolean))];

  const totalPages = Math.ceil(filteredList.length / TICKETS_PER_PAGE);
  const paginatedTickets = filteredList.slice(
    (page - 1) * TICKETS_PER_PAGE,
    page * TICKETS_PER_PAGE
  );

  const handleCloseTicket = async (ticketId) => {
    if (loadingTickets[ticketId]) return;
    setLoadingTickets((prev) => ({ ...prev, [ticketId]: true }));

    try {
      const ticket = tickets.find((t) => extractId(t._id) === ticketId);
      await axios.patch(`${API_BASE_URL}/api/tickets/close/${ticketId}`);

      showBrowserNotification(
        "Ticket Closed",
        `${currentStaff?.name || "Staff"} closed ticket ${ticket?.ticketId}`
      );

      toast.success("Ticket closed successfully!");
      await fetchTickets();

      // ✅ Navigate to Closed tab after closing
      setActiveTab("closed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to close ticket");
    } finally {
      setLoadingTickets((prev) => ({ ...prev, [ticketId]: false }));
    }
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
      <div className="tickets-history-page">
        <h2 className="page-title">Ticket History</h2>
        {/* Tabs */}
        <div className="ticket-tabs">
          {currentStaff?.role === "admin" && (
            <button
              className={activeTab === "pendingClosure" ? "active" : ""}
              onClick={() => setActiveTab("pendingClosure")}
            >
              Pending Closure
            </button>
          )}
          <button
            className={activeTab === "closed" ? "active" : ""}
            onClick={() => setActiveTab("closed")}
          >
            Closed Tickets
          </button>
        </div>

        {/* Filters */}
        <div className="ticket-card-filters">
          <input
            placeholder="Search by Ticket ID, Creator, Zone..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />

          <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
            <option value="">All Zones</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>

          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace("-", " ")}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

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
        <div className="ticket-card-container grid">
          {paginatedTickets.length === 0 ? (
            <p>No tickets found.</p>
          ) : (
            paginatedTickets.map((t) => {
              const normalizedId = extractId(t._id);
              const remarksMain = t.remarks
                ? t.remarks.replace(/on hold/gi, "").replace(/\s\s+/g, " ").split("| Updated:")[0].trim() ||
                  "No remarks"
                : "No remarks";

              const updatedRemarks =
                t.remarks && t.remarks.includes("| Updated:")
                  ? t.remarks.split("| Updated:")[1].trim()
                  : "";

              const isResolved = normalizeStatus(t.status) === "Resolved";
              const isClosed = normalizeStatus(t.status) === "Closed";

              if (isClosed) {
                return (
                  <ClosedTicketWrapper key={normalizedId} status={t.status} ticketId={t.ticketId}>
                    <div className="ticket-card closed-card">
                     <div className="card-header">
  <div className="header-top">
    <span className={`badge status-${t.status}`}>{normalizeStatus(t.status)}</span>
    <span className={`badge ${t.priority || "low"}`}>{t.priority}</span>
  </div>
  <div className="header-bottom">
    <span className="ticket-icon">🎫</span>
    <span className="ticket-id">{t.ticketId}</span>
  </div>
</div>


                      <div className="card-body">
                        <div><strong>Created By:</strong> {t.createdBy}</div>
                        <div><strong>Created On:</strong> {formatDate(t.createdAt)} {formatTime(t.createdAt)}</div>
                        <div className="ticket-location">
                          <div><strong>Zone:</strong> {t.zoneNo}</div>
                          <div><strong>Apartment:</strong> {t.apartmentName}</div>
                          <div><strong>Room:</strong> {t.roomNo}</div>
                        </div>

                        <div className="remarks-wrapper">
                          <strong>Remarks:</strong>
                          <ExpandableText text={remarksMain} maxLength={70} />
                        </div>

                        {t.assignedTo && (
                          <div className="assigned-badge"><strong>Assigned To:</strong> {t.assignedTo}</div>
                        )}

                        {updatedRemarks && (
                          <div className="updated-remarks"><strong>Updated Remarks:</strong> <ExpandableText text={updatedRemarks} maxLength={70} /></div>
                        )}

                        <LastUpdated date={//t.lastUpdated || 
                          t.updatedAt || 
                          //t.createdAt || 
                          t.createdAt} />
                      </div>
                    </div>
                  </ClosedTicketWrapper>
                );
              }

              // For Resolved tickets → allow Close Ticket
              return (
                <div key={normalizedId} className={`ticket-card ${isResolved ? "resolved-card" : ""}`}>
                  {isResolved && <div className="resolved-ribbon">RESOLVED</div>}

               <div className="card-header">
  <div className="header-top">
    <span className={`badge status-${t.status}`}>{normalizeStatus(t.status)}</span>
    <span className={`badge ${t.priority || "low"}`}>{t.priority}</span>
  </div>
  <div className="header-bottom">
    <span className="ticket-icon">🎫</span>
    <span className="ticket-id">{t.ticketId}</span>
  </div>
</div>



                  <div className="card-body">
                    <div><strong>Created By:</strong> {t.createdBy}</div>
                        <div><strong>Created On:</strong> {formatDate(t.createdAt)} {formatTime(t.createdAt)}</div>

                    <div className="ticket-location">
                      <div><strong>Zone:</strong> {t.zoneNo}</div>
                      <div><strong>Apartment:</strong> {t.apartmentName}</div>
                      <div><strong>Room:</strong> {t.roomNo}</div>
                    </div>

                    <div className="remarks-wrapper">
                      <strong>Remarks:</strong>
                      <ExpandableText text={remarksMain} maxLength={70} />
                    </div>

                    {t.assignedTo && <div className="assigned-badge"><strong>Assigned To:</strong> {t.assignedTo}</div>}

                    {updatedRemarks && <div className="updated-remarks"><strong>Updated Remarks:</strong> <ExpandableText text={updatedRemarks} maxLength={70} /></div>}

                    {isResolved && (
                      <button
                        className="close-ticket-btn"
                        disabled={loadingTickets[normalizedId]}
                        onClick={() => handleCloseTicket(normalizedId)}
                      >
                        {loadingTickets[normalizedId] ? "Closing..." : "Close Ticket"}
                      </button>
                    )}

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
          <div className="pagination">
            <button onClick={() => setPage(page - 1)} disabled={page === 1}>&lt; Prev</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} className={`pagination-page-btn ${page === i + 1 ? "active" : ""}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next &gt;</button>
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default TicketHistory;
