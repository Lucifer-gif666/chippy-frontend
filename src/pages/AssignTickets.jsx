// src/pages/AssignTickets.jsx
import React, { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import StaffLayout from "../layout/StaffLayout";
import "../styles/AssignTickets.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ExpandableText from "../components/ExpandableText";
import LastUpdated from "../components/LastUpdated";
import { showBrowserNotification } from "../utils/browserNotifications";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AssignTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Filters
  const [filterText, setFilterText] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [activeTab, setActiveTab] = useState("unassigned");
  const [highlightTicket, setHighlightTicket] = useState(null);
  const rowRefs = useRef({});
  const TICKETS_PER_PAGE = 12;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filterText, filterZone, filterPriority, filterStatus, filterDate, activeTab]);

  const ALLOWED_STATUS_NORMALS = new Set([
    "pending",
    "in-progress",
    "inprogress",
    "on-hold",
    "onhold",
  ]);

  const normalizeStatus = (s) =>
    s ? String(s).toLowerCase().replace(/\s+/g, "-").replace(/_+/g, "-") : "";

  const formatToDDMMYYYY = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  // Fetch staff + tickets
  const fetchData = async () => {
    try {
      const staffRes = await api.get("/api/staff");
      const staffData = staffRes.data;
      setStaffList(staffData);

      const ticketsRes = await api.get("/api/tickets");
      const ticketsWithStaffNames = ticketsRes.data.map((t) => {
        const assignedStaffId = t.assignedToId?._id || t.assignedToId;
        const staff = staffData.find(
          (s) => String(s._id) === String(assignedStaffId)
        );

        return {
          ...t,
          staffName: staff ? staff.name : "None",
          assignedToId: staff ? staff._id : assignedStaffId || null,
          status: t.status?.toLowerCase(),
          priority: t.priority?.toLowerCase(),
        };
      });

      setTickets(ticketsWithStaffNames);
    } catch (err) {
      toast.error("Failed to fetch data!");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  const currentStaff = JSON.parse(localStorage.getItem("currentStaff"));

  // 🔹 Assign ticket (FINAL SAFE VERSION)
  const handleAssign = async (ticketMongoId, staffId) => {
    if (!staffId) return;

    const staff = staffList.find((s) => s._id === staffId);
    const ticket = tickets.find((t) => t._id === ticketMongoId);
    if (!ticket || !staff) return;

    let assignSuccess = false;

    try {
      await api.patch(`/api/tickets/assign/${ticketMongoId}`, {
        staffId,
        staffName: staff.name,
        assignedBy: currentStaff.name,
      });
      

      assignSuccess = true;

      setTickets((prev) =>
        prev.map((t) =>
          t._id === ticketMongoId
            ? {
                ...t,
                assignedToId: staffId,
                staffName: staff.name,
                lastUpdated: new Date().toISOString(),
              }
            : t
        )
      );

      toast.success(`Ticket ${ticket.ticketId} assigned to ${staff.name}`);
      setHighlightTicket(ticketMongoId);
      setActiveTab("assigned");

      setTimeout(() => {
        rowRefs.current[ticketMongoId]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 200);

      setTimeout(() => setHighlightTicket(null), 3000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign ticket!");
    }

    // 🔔 Notification OUTSIDE try/catch (cannot break logic)
    if (assignSuccess) {
      try {
        if (Notification.permission === "granted") {
          showBrowserNotification(
            "Ticket Assigned",
            `${currentStaff.name} assigned ticket ${ticket.ticketId} to ${staff.name}`
          );
        }
      } catch (e) {
        console.log("Notification blocked on mobile");
      }
    }
  };

  const filteredTickets = tickets
    .filter((t) => {
      const textMatch =
        !filterText ||
        (t.ticketId || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (t.createdBy || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (t.zoneNo || "").toLowerCase().includes(filterText.toLowerCase());

      const zoneMatch = filterZone ? t.zoneNo === filterZone : true;
      const priorityMatch = filterPriority
        ? t.priority === filterPriority.toLowerCase()
        : true;
      const statusMatch = filterStatus
        ? normalizeStatus(t.status) === filterStatus
        : true;

      const ticketDate = formatToDDMMYYYY(t.createdAt);
      const calendarDate = filterDate
        ? filterDate.split("-").reverse().join("-")
        : "";

      return (
        textMatch &&
        zoneMatch &&
        priorityMatch &&
        statusMatch &&
        (!filterDate || ticketDate === calendarDate)
      );
    })
    .filter((t) => {
      const norm = normalizeStatus(t.status);
      if (!ALLOWED_STATUS_NORMALS.has(norm)) return false;
      return activeTab === "unassigned" ? !t.assignedToId : !!t.assignedToId;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const zones = [...new Set(filteredTickets.map((t) => t.zoneNo).filter(Boolean))];
  const priorities = [...new Set(filteredTickets.map((t) => t.priority).filter(Boolean))];
  const statuses = [...new Set(filteredTickets.map((t) => normalizeStatus(t.status)).filter(Boolean))];

  const totalPages = Math.ceil(filteredTickets.length / TICKETS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (page - 1) * TICKETS_PER_PAGE,
    page * TICKETS_PER_PAGE
  );

  const unassignedCount = tickets.filter(
    (t) =>
      ALLOWED_STATUS_NORMALS.has(normalizeStatus(t.status)) &&
      !t.assignedToId
  ).length;

  return (
    <StaffLayout>
      <h2 className="page-title">Assign Tickets</h2>

      {/* Tabs */}
      <div className="ticket-tabs">
        <button
          className={activeTab === "unassigned" ? "active" : ""}
          onClick={() => setActiveTab("unassigned")}
        >
          Unassigned Tickets ({unassignedCount})
        </button>
        <button
          className={activeTab === "assigned" ? "active" : ""}
          onClick={() => setActiveTab("assigned")}
        >
          Manage Assignments
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
          {zones.map((z) => (
            <option key={z} value={z}>{z}</option>
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
          {statuses.map((s) => (
            <option key={s} value={s}>{s.replace("-", " ")}</option>
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
      <div className="ticket-card-container assign-grid">
        {paginatedTickets.length === 0 ? (
          <p>No tickets found.</p>
        ) : (
          paginatedTickets.map((t) => (
            <div
              key={t._id}
              ref={(el) => (rowRefs.current[t._id] = el)}
              className={`ticket-card ${
                highlightTicket === t._id ? "new-ticket-highlight" : ""
              }`}
            >
              {t.assignedToId && <div className="assigned-ribbon">ASSIGNED</div>}

              <div className="card-header">
                <div className="header-top">
                  <span className={`badge status-${t.status}`}>
                    {normalizeStatus(t.status)}
                  </span>
                  <span className={`badge ${t.priority || "low"}`}>
                    {t.priority}
                  </span>
                </div>
                <div className="header-bottom">
                  <span className="ticket-icon">🎫</span>
                  <span className="ticket-id">{t.ticketId}</span>
                </div>
              </div>

              <div className="card-body">
                <div><strong>Created By:</strong> {t.createdBy}</div>
                <div><strong>Created On:</strong> {formatToDDMMYYYY(t.createdAt)}</div>

                <div className="ticket-location">
                  <div><strong>Zone:</strong> {t.zoneNo}</div>
                  <div><strong>Apartment:</strong> {t.apartmentName}</div>
                  <div><strong>Room:</strong> {t.roomNo}</div>
                </div>

                <div className="remarks-wrapper">
                  <strong>Remarks:</strong>
                  <ExpandableText text={t.remarks || "No remarks"} maxLength={80} />
                </div>

                <div className="assigned-badge">
                  <strong>Assigned To:</strong> {t.staffName || "None"}
                </div>

                <div className="assign-section">
                  <select
                    value=""
                    onChange={(e) => handleAssign(t._id, e.target.value)}
                    disabled={normalizeStatus(t.status) === "resolved"}
                  >
                    <option value="" disabled hidden>
                      {t.assignedToId
                        ? normalizeStatus(t.status) === "resolved"
                          ? "Resolved - cannot reassign"
                          : "Reassign Staff"
                        : "Assign Staff"}
                    </option>
                    {staffList
  .filter(
    (s) =>
      s.role !== "admin" && // 🚫 hide admins
      String(s._id) !== String(t.assignedToId)
  )
  .map((s) => (
    <option key={s._id} value={s._id}>
      {s.name}
    </option>
  ))}

                  </select>
                </div>

                <LastUpdated
                  date={
                    //t.lastUpdated ||
                    t.updatedAt ||
                    //t.createdAt ||
                    t.createdAt
                  }
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            &lt; Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`pagination-page-btn ${
                page === i + 1 ? "active" : ""
              }`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next &gt;
          </button>
        </div>
      )}
    </StaffLayout>
  );
};

export default AssignTickets;
