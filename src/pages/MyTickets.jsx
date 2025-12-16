// src/pages/MyTickets.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import StaffLayout from "../layout/StaffLayout";
import ExpandableText from "../components/ExpandableText";
import LastUpdated from "../components/LastUpdated";
import "../styles/MyTickets.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ⭐ Reusable wrapper import
import ClosedTicketWrapper from "../ReusableComp/ClosedTicketWrapper";

// ✅ Browser notification helper
import { showBrowserNotification } from "../utils/browserNotifications";

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

  const handlePageChange = (val) => setPage(val);

  useEffect(() => setPage(1), [activeTab, filterText, filterZone, filterPriority, filterStatus, filterDate]);

  const rawStaff = localStorage.getItem("currentStaff");
  const currentStaff = rawStaff ? JSON.parse(rawStaff) : null;

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
      const res = await axios.get(`http://localhost:5000/api/tickets${staffId ? `?staffId=${staffId}` : ""}`);
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch tickets!");
    }
  };

  useEffect(() => { fetchTickets(); }, []);
  useEffect(() => { const interval = setInterval(fetchTickets, 30000); return () => clearInterval(interval); }, []);

  const normalizeStatus = (status) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s.includes("pending")) return "Pending";
    if (s.includes("in progress")) return "In Progress";
    if (s.includes("resolved")) return "Resolved";
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

  // ✅ Tickets filtered per tab before applying filter dropdowns
  const ticketsForActiveTab = tickets.filter((t) => {
    const assignedId = extractId(t.assignedToId);
    const createdId = extractId(t.createdById);

    if (activeTab === "inprogress") return assignedId === staffId && normalizeStatus(t.status) === "In Progress";
    if (activeTab === "resolved") return assignedId === staffId && normalizeStatus(t.status) === "Resolved";
    if (activeTab === "created") return createdId === staffId;
    return assignedId === staffId && normalizeStatus(t.status) === "Pending";
  });

  // ✅ Dynamic filter options per tab
  const zones = [...new Set(ticketsForActiveTab.map((t) => t.zoneNo).filter(Boolean))];
  const priorities = [...new Set(ticketsForActiveTab.map((t) => t.priority).filter(Boolean))];
  const statuses = [...new Set(ticketsForActiveTab.map((t) => normalizeStatus(t.status)).filter(Boolean))];

  const filteredTickets = () => {
    return ticketsForActiveTab.filter((t) => {
      const matchesText = filterText
        ? (t.ticketId || "").toLowerCase().includes(filterText.toLowerCase()) ||
          (t.createdBy || "").toLowerCase().includes(filterText.toLowerCase()) ||
          (t.zoneNo || "").toLowerCase().includes(filterText.toLowerCase())
        : true;
      const matchesZone = filterZone ? t.zoneNo === filterZone : true;
      const matchesPriority = filterPriority ? t.priority === filterPriority : true;
      const matchesStatus = filterStatus ? normalizeStatus(t.status) === filterStatus : true;
      const formattedCalendarDate = filterDate ? new Date(filterDate).toISOString().slice(0,10) : "";
      const matchesDate = !filterDate || new Date(t.createdDate).toISOString().slice(0,10) === formattedCalendarDate;
      return matchesText && matchesZone && matchesPriority && matchesStatus && matchesDate;
    });
  };

  const list = filteredTickets();
  const totalPages = Math.ceil(list.length / TICKETS_PER_PAGE);
  const paginatedTickets = list.slice((page - 1) * TICKETS_PER_PAGE, page * TICKETS_PER_PAGE);

  // ✅ Accept Ticket → auto navigate + highlight
  const handleAccept = async (ticketId) => {
    if (loadingTickets[ticketId]) return;
    const ticket = tickets.find((t) => extractId(t._id) === ticketId);
    if (!ticket) return;

    setLoadingTickets((prev) => ({ ...prev, [ticketId]: true }));
    try {
      await axios.patch(`http://localhost:5000/api/tickets/accept/${ticketId}`);
      showBrowserNotification("Ticket Accepted", `${currentStaff.name} accepted ticket ${ticket.ticketId}`);
      toast.success(`Ticket ${ticket.ticketId} accepted!`);
      await fetchTickets();
      setActiveTab("inprogress");
      setHighlightTicket(ticketId);
      setTimeout(() => setHighlightTicket(null), 3000);
      rowRefs.current[ticketId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept ticket");
    } finally {
      setLoadingTickets((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  // ✅ Resolve Ticket → auto navigate + highlight
  const handleResolve = async (ticketId) => {
    const updatedRemarks = (remarksInput[ticketId] || "").trim();
    if (!updatedRemarks) return toast.error("Please enter updated remarks.");
    if (loadingTickets[ticketId]) return;
    const ticket = tickets.find((t) => extractId(t._id) === ticketId);
    if (!ticket) return;

    setLoadingTickets((prev) => ({ ...prev, [ticketId]: true }));
    try {
      await axios.patch(`http://localhost:5000/api/tickets/resolve/${ticketId}`, { 
        updatedRemarks,
        resolvedBy: currentStaff?.name,
        resolvedById: currentStaff?._id
      });
      showBrowserNotification("Ticket Resolved", `${currentStaff.name} resolved ticket ${ticket.ticketId}`);
      toast.success(`Ticket ${ticket.ticketId} resolved!`);
      setRemarksInput((prev) => ({ ...prev, [ticketId]: "" }));
      await fetchTickets();
      setActiveTab("resolved");
      setHighlightTicket(ticketId);
      setTimeout(() => setHighlightTicket(null), 3000);
      rowRefs.current[ticketId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to resolve ticket");
    } finally {
      setLoadingTickets((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  // ✅ Hold Ticket
const handleHold = async (ticketId) => {
  if (loadingTickets[ticketId]) return;

  const ticket = tickets.find((t) => extractId(t._id) === ticketId);
  if (!ticket) return;

  setLoadingTickets((prev) => ({ ...prev, [ticketId]: true }));

  try {
    await axios.patch(`http://localhost:5000/api/tickets/hold/${ticketId}`, {
      updatedRemarks: "On Hold",
      heldBy: currentStaff?.name,
      heldById: currentStaff?._id,
    });

    showBrowserNotification(
      "Ticket On Hold",
      `${currentStaff.name} put ticket ${ticket.ticketId} on hold`
    );

    toast.info(`Ticket ${ticket.ticketId} is on hold`);
    await fetchTickets();
  } catch (err) {
    console.error(err);
    toast.error("Failed to put ticket on hold");
  } finally {
    setLoadingTickets((prev) => ({ ...prev, [ticketId]: false }));
  }
};


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
                      <div><strong>Created On:</strong> {formatToDDMMYYYY(t.createdDate)}</div>

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
                      <LastUpdated date={t.lastUpdated || t.updatedAt || t.createdDate || t.createdAt} />
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
