// src/pages/MyTickets.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import StaffLayout from "../layout/StaffLayout";
import ExpandableText from "../components/ExpandableText";
import LastUpdated from "../components/LastUpdated";
import "../styles/MyTickets.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ⭐ Reusable wrapper
import ClosedTicketWrapper from "../ReusableComp/ClosedTicketWrapper";

// 🔔 Notification helper (mobile-safe usage)
import { showBrowserNotification } from "../utils/browserNotifications";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("assigned");

  const [filterText, setFilterText] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [loadingTickets, setLoadingTickets] = useState({});
  const [remarksInput, setRemarksInput] = useState({});
  const [highlightTicket, setHighlightTicket] = useState(null);

  const TICKETS_PER_PAGE = 12;
  const [page, setPage] = useState(1);
  const rowRefs = useRef({});

  const handlePageChange = (p) => setPage(p);

  useEffect(() => {
    setPage(1);
  }, [activeTab, filterText, filterZone, filterPriority, filterStatus, filterDate]);

  // 🔐 Current staff
  const rawStaff = localStorage.getItem("currentStaff");
  const currentStaff = rawStaff ? JSON.parse(rawStaff) : null;

  // 🧠 Robust ID extractor
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

  const staffId = extractId(currentStaff?._id);

  // 📡 Fetch tickets
  const fetchTickets = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/tickets${staffId ? `?staffId=${staffId}` : ""}`
      );
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch tickets!");
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  // 🔄 Status normalizer
  const normalizeStatus = (status) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s.includes("pending")) return "Pending";
    if (s.includes("in progress")) return "In Progress";
    if (s.includes("resolved")) return "Resolved";
    return status;
  };

  // 📅 Date & time helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // 🧩 Tickets per active tab
  const ticketsForActiveTab = tickets.filter((t) => {
    const assignedId = extractId(t.assignedToId);
    const createdId = extractId(t.createdById);

    if (activeTab === "inprogress")
      return assignedId === staffId && normalizeStatus(t.status) === "In Progress";
    if (activeTab === "resolved")
      return assignedId === staffId && normalizeStatus(t.status) === "Resolved";
    if (activeTab === "created") return createdId === staffId;

    return assignedId === staffId && normalizeStatus(t.status) === "Pending";
  });

  // 🎛️ Filter options
  const zones = [...new Set(ticketsForActiveTab.map(t => t.zoneNo).filter(Boolean))];
  const priorities = [...new Set(ticketsForActiveTab.map(t => t.priority).filter(Boolean))];
  const statuses = [...new Set(ticketsForActiveTab.map(t => normalizeStatus(t.status)).filter(Boolean))];

  // 🔍 Apply filters
  const filteredTickets = ticketsForActiveTab.filter((t) => {
    const matchesText =
      !filterText ||
      (t.ticketId || "").toLowerCase().includes(filterText.toLowerCase()) ||
      (t.createdBy || "").toLowerCase().includes(filterText.toLowerCase()) ||
      (t.zoneNo || "").toLowerCase().includes(filterText.toLowerCase());

    const matchesZone = filterZone ? t.zoneNo === filterZone : true;
    const matchesPriority = filterPriority ? t.priority === filterPriority : true;
    const matchesStatus = filterStatus ? normalizeStatus(t.status) === filterStatus : true;

    const matchesDate = !filterDate
      || new Date(t.createdAt).toISOString().slice(0, 10)
        === new Date(filterDate).toISOString().slice(0, 10);

    return matchesText && matchesZone && matchesPriority && matchesStatus && matchesDate;
  });

  // 📄 Pagination
  const totalPages = Math.ceil(filteredTickets.length / TICKETS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (page - 1) * TICKETS_PER_PAGE,
    page * TICKETS_PER_PAGE
  );

  // ===================== ACTIONS (MOBILE SAFE) ===================== //

  const safeNotify = (title, body) => {
    try {
      if (Notification.permission === "granted") {
        showBrowserNotification(title, body);
      }
    } catch {
      console.log("Notification blocked on mobile");
    }
  };

  // ✅ ACCEPT
  const handleAccept = async (id) => {
    if (loadingTickets[id]) return;
    const ticket = tickets.find(t => extractId(t._id) === id);
    if (!ticket) return;

    setLoadingTickets(p => ({ ...p, [id]: true }));
    let success = false;

    try {
      await axios.patch(`${API_BASE_URL}/api/tickets/accept/${id}`);
      success = true;

      toast.success(`Ticket ${ticket.ticketId} accepted!`);
      await fetchTickets();
      setActiveTab("inprogress");
      setHighlightTicket(id);
      setTimeout(() => setHighlightTicket(null), 3000);
      rowRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept ticket");
    } finally {
      setLoadingTickets(p => ({ ...p, [id]: false }));
    }

    if (success) {
      safeNotify("Ticket Accepted", `${currentStaff.name} accepted ticket ${ticket.ticketId}`);
    }
  };

  // ✅ RESOLVE
  const handleResolve = async (id) => {
    const updatedRemarks = (remarksInput[id] || "").trim();
    if (!updatedRemarks) return toast.error("Please enter updated remarks.");
    if (loadingTickets[id]) return;

    const ticket = tickets.find(t => extractId(t._id) === id);
    if (!ticket) return;

    setLoadingTickets(p => ({ ...p, [id]: true }));
    let success = false;

    try {
      await axios.patch(`${API_BASE_URL}/api/tickets/resolve/${id}`, {
        updatedRemarks,
        resolvedBy: currentStaff?.name,
        resolvedById: currentStaff?._id,
      });

      success = true;
      toast.success(`Ticket ${ticket.ticketId} resolved!`);
      setRemarksInput(p => ({ ...p, [id]: "" }));
      await fetchTickets();
      setActiveTab("resolved");
      setHighlightTicket(id);
      setTimeout(() => setHighlightTicket(null), 3000);
      rowRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to resolve ticket");
    } finally {
      setLoadingTickets(p => ({ ...p, [id]: false }));
    }

    if (success) {
      safeNotify("Ticket Resolved", `${currentStaff.name} resolved ticket ${ticket.ticketId}`);
    }
  };

  // ✅ HOLD
  const handleHold = async (id) => {
    if (loadingTickets[id]) return;
    const ticket = tickets.find(t => extractId(t._id) === id);
    if (!ticket) return;

    setLoadingTickets(p => ({ ...p, [id]: true }));
    let success = false;

    try {
      await axios.patch(`${API_BASE_URL}/api/tickets/hold/${id}`, {
        updatedRemarks: "On Hold",
        heldBy: currentStaff?.name,
        heldById: currentStaff?._id,
      });

      success = true;
      toast.info(`Ticket ${ticket.ticketId} is on hold`);
      await fetchTickets();
    } catch (err) {
      console.error(err);
      toast.error("Failed to put ticket on hold");
    } finally {
      setLoadingTickets(p => ({ ...p, [id]: false }));
    }

    if (success) {
      safeNotify("Ticket On Hold", `${currentStaff.name} put ticket ${ticket.ticketId} on hold`);
    }
  };

  // ===================== UI ===================== //
  return (
    <StaffLayout>
        <h2 className="page-title">My Tickets</h2>
      <div className="my-tickets-page">
        {/* Tabs */}
        <div className="ticket-tabs">
          {["assigned", "inprogress", "resolved", "created"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "assigned" ? "Assigned To You"
                : tab === "inprogress" ? "In Progress"
                : tab === "resolved" ? "Resolved"
                : "Created By You"}
            </button>
          ))}
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
            {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <button
            className="reset-btn"
            onClick={() => {
              setFilterText(""); setFilterZone(""); setFilterPriority(""); setFilterStatus(""); setFilterDate("");
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
              const onHold = t.remarks?.toLowerCase().includes("on hold");
              const isLoading = loadingTickets[normalizedId];
              const isResolved = normalizeStatus(t.status) === "Resolved";

              const remarksMain = t.remarks
                ? t.remarks.replace(/on hold/gi, "").replace(/\s\s+/g, " ").split("| Updated:")[0].trim() || "No remarks"
                : "No remarks";

              const updatedRemarks = t.remarks && t.remarks.includes("| Updated:")
                ? t.remarks.split("| Updated:")[1].trim()
                : "";

              const cardClass = isResolved
                ? "resolved-card"
                : onHold && normalizeStatus(t.status) === "In Progress"
                ? "on-hold-card"
                : "";

              return (
                <ClosedTicketWrapper key={normalizedId} status={t.status} ticketId={t.ticketId}>
                  <div
                    ref={(el) => (rowRefs.current[normalizedId] = el)}
                    className={`ticket-card ${cardClass} ${highlightTicket === normalizedId ? "new-ticket-highlight" : ""}`}
                  >
                    {onHold && normalizeStatus(t.status) === "In Progress" && <div className="on-hold-ribbon">ON HOLD</div>}
                    {isResolved && <div className="resolved-ribbon">RESOLVED</div>}
                   <div className="card-header myticket-header">
  {/* Top row */}
  <div className="myticket-header-top">
    <span
      className={`badge status-${normalizeStatus(t.status)
        ?.toLowerCase()
        .replace(" ", "-")}`}
    >
      {normalizeStatus(t.status)}
    </span>

    <span className={`badge ${t.priority?.toLowerCase() || "low"}`}>
      {t.priority}
    </span>
  </div>

  {/* Bottom row */}
  <div className="myticket-header-bottom">
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
                      <div className="remarks-wrapper" style={{ marginTop: 6 }}>
                        <strong>Remarks:</strong>{" "}
                        <ExpandableText text={remarksMain} maxLength={70} />
                      </div>
                      {t.assignedTo && (
                        <div className="assigned-badge" style={{ marginTop: 6 }}>
                          <strong>Assigned To:</strong> {t.assignedTo}
                        </div>
                      )}
                      {updatedRemarks && (
                        <div className="updated-remarks" style={{ marginTop: 6 }}>
                          <strong>Updated Remarks:</strong>{" "}
                          <ExpandableText text={updatedRemarks} maxLength={70} />
                        </div>
                      )}

                      {/* Buttons */}
                      {activeTab === "inprogress" && (
                        <div style={{ marginTop: 10 }}>
                          <input
                            placeholder="Enter updated remarks"
                            value={remarksInput[normalizedId] || ""}
                            onChange={(e) =>
                              setRemarksInput((prev) => ({ ...prev, [normalizedId]: e.target.value }))
                            }
                          />
                          <div className="progress-actions">
                            <button
                              className={`hold-btn ${isLoading || onHold ? "disabled-btn" : ""}`}
                              disabled={isLoading || onHold}
                              onClick={() => handleHold(normalizedId)}
                            >
                              {onHold ? "On Hold" : "Hold"}
                            </button>
                            <button
                              className={`resolve-btn ${isLoading || !(remarksInput[normalizedId] && remarksInput[normalizedId].trim()) ? "disabled-btn" : ""}`}
                              disabled={isLoading || !(remarksInput[normalizedId] && remarksInput[normalizedId].trim())}
                              onClick={() => handleResolve(normalizedId)}
                            >
                              {isLoading ? "Resolving..." : "Resolve"}
                            </button>
                          </div>
                        </div>
                      )}
                      {activeTab === "assigned" && normalizeStatus(t.status) === "Pending" && (
                        <button
                          className={`accept-btn ${isLoading ? "disabled-btn" : ""}`}
                          disabled={isLoading}
                          onClick={() => handleAccept(normalizedId)}
                        >
                          {isLoading ? "Accepting..." : "Accept"}
                        </button>
                      )}
                      <LastUpdated date={//t.lastUpdated || 
                        t.updatedAt || 
                        //t.createdAt || 
                        t.createdAt} />
                    </div>
                  </div>
                </ClosedTicketWrapper>
              );
            })
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>&lt; Prev</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} className={`pagination-page-btn ${page === i + 1 ? "active" : ""}`} onClick={() => handlePageChange(i + 1)}>{i + 1}</button>
            ))}
            <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>Next &gt;</button>
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default MyTickets;
