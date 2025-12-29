import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import StaffLayout from "../layout/StaffLayout";
import "../styles/StaffManagement.css";

const StaffManagement = () => {
  const [allStaff, setAllStaff] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "staff" });
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [roleFilter, setRoleFilter] = useState("all");

  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [actionLoadingIds, setActionLoadingIds] = useState({});

  const [allTickets, setAllTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const currentUserId = localStorage.getItem("userId");

  // NEW: Active Tab
  const [activeTab, setActiveTab] = useState("staff-list"); // "staff-list" or "staff-performance"

  const safeParse = async (res) => {
    try {
      const text = await res.text();
      if (!text) return {};
      try {
        return JSON.parse(text);
      } catch {
        return { message: text };
      }
    } catch {
      return {};
    }
  };

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff`);
      const data = await safeParse(res);

      if (Array.isArray(data)) {
        setAllStaff(data);
      } else if (data?.staff && Array.isArray(data.staff)) {
        setAllStaff(data.staff);
      } else {
        toast.error("Unexpected staff response format");
        setAllStaff([]);
      }
    } catch {
      toast.error("Failed to load staff");
      setAllStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets`);
      const data = await safeParse(res);
      if (Array.isArray(data)) {
        setAllTickets(data);
      } else {
        setAllTickets([]);
        toast.error("Failed to fetch tickets");
      }
    } catch {
      setAllTickets([]);
      toast.error("Failed to fetch tickets");
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => {
    const s = search.trim().toLowerCase();

    const filtered = allStaff.filter((staff) => {
      const matchesSearch =
        staff.name.toLowerCase().includes(s) ||
        staff.email.toLowerCase().includes(s);

      const matchesRole =
        roleFilter === "all" ? true : staff.role === roleFilter;

      return matchesSearch && matchesRole;
    });

    filtered.sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

    const pages = Math.max(1, Math.ceil(filtered.length / limit));
    const clampedPage = Math.min(page, pages);

    setTotalPages(pages);
    if (clampedPage !== page) setPage(clampedPage);

    const start = (clampedPage - 1) * limit;
    setStaffList(filtered.slice(start, start + limit));
  }, [allStaff, search, roleFilter, sortOrder, page]);

  // Reset to first page when filters/search/sort or tab change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, sortOrder, activeTab]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    if (activeTab === "staff-performance") fetchTickets();
  }, [activeTab, fetchTickets]);

  const handleRefresh = async () => {
    setPage(1);
    await fetchStaff();
    toast.info("Refreshed staff list");
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email) {
      toast.error("Name and email are required");
      return;
    }

    if (!window.confirm(`Add ${newStaff.name} as ${newStaff.role}?`)) return;

    try {
      setAdding(true);
      const res = await fetch(`${API_BASE_URL}/api/staff/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      });

      const data = await safeParse(res);

      if (res.ok) {
        toast.success(data.message || "Staff added");
        setNewStaff({ name: "", email: "", role: "staff" });
        setPage(1);
        await fetchStaff();
      } else {
        toast.error(data.message || "Failed to add staff");
      }
    } catch {
      toast.error("Failed to add staff");
    } finally {
      setAdding(false);
    }
  };

  const setIdLoading = (id, v) =>
    setActionLoadingIds((prev) => ({ ...prev, [id]: v }));

  const handleRoleChange = async (id, newRole) => {
    if (id === currentUserId) {
      toast.error("You cannot change your own role");
      return;
    }

    if (!window.confirm("Are you sure you want to change this user's role?"))
      return;

    try {
      setIdLoading(id, true);

      const res = await fetch(
        `http://localhost:5000/api/staff/update-role/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await safeParse(res);

      if (res.ok) {
        toast.success(data.message || "Role updated");
        await fetchStaff();
      } else {
        toast.error(data.message || "Failed to update role");
      }
    } catch {
      toast.error("Failed to update role");
    } finally {
      setIdLoading(id, false);
    }
  };

  const toggleVerified = async (id) => {
    if (!window.confirm("Change this user's active/inactive status?")) return;

    try {
      setIdLoading(id, true);

      const res = await fetch(
        `http://localhost:5000/api/staff/toggle-verified/${id}`,
        { method: "PATCH" }
      );

      const data = await safeParse(res);

      if (res.ok) {
        toast.success(data.message || "Status changed");
        await fetchStaff();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Failed");
    } finally {
      setIdLoading(id, false);
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (id === currentUserId) {
      toast.error("You cannot delete your own account");
      return;
    }

    if (!window.confirm(`Delete ${name}? This action is permanent.`)) return;

    try {
      setIdLoading(id, true);

      const urls = [
        `http://localhost:5000/api/staff/${id}`,
        `http://localhost:5000/api/staff/delete/${id}`,
      ];

      let res, data;

      for (const url of urls) {
        try {
          res = await fetch(url, { method: "DELETE" });
          data = await safeParse(res);
          if (res.ok) break;
        } catch {}
      }

      if (res?.ok) {
        toast.success(data?.message || "Staff deleted");
        await fetchStaff();

        setTimeout(() => {
          setPage((p) => {
            const newTotal = Math.max(
              1,
              Math.ceil((allStaff.length - 1) / limit)
            );
            return Math.min(p, newTotal);
          });
        }, 0);
      } else {
        toast.error(data?.message || "Failed to delete staff");
      }
    } catch {
      toast.error("Failed to delete staff");
    } finally {
      setIdLoading(id, false);
    }
  };

  // STAFF PERFORMANCE COMPUTATION
  const filteredStaffForPerformance = allStaff
    .filter((staff) => {
      const s = search.trim().toLowerCase();
      const matchesSearch =
        staff.name.toLowerCase().includes(s) ||
        staff.email.toLowerCase().includes(s);
      const matchesRole =
        roleFilter === "all" ? true : staff.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

    const staffPerformance = filteredStaffForPerformance.map((staff) => {
      // Tickets created by this staff
      const createdTickets = allTickets.filter(
        (t) => t.createdBy === staff.name
      ).length;      
    
      // Tickets resolved by this staff
      const resolvedTickets = allTickets.filter(
        (t) => t.resolvedBy === staff.name && t.status === "Resolved"
      ).length;
      
    
      return { ...staff, createdTickets, resolvedTickets };
    });
    
    
  return (
    <StaffLayout>
      <div className="staff-management-container">
        <div>
          <h2 className="page-title">Staff Management</h2>
        </div>

        {/* TABS */}
        <div className="ticket-tabs">
          <button
            className={activeTab === "staff-list" ? "active" : ""}
            onClick={() => setActiveTab("staff-list")}
          >
            Staff List
          </button>
          <button
            className={activeTab === "staff-performance" ? "active" : ""}
            onClick={() => setActiveTab("staff-performance")}
          >
            Staff Performance
          </button>
          <div
            className="active-tab-underline"
            style={{
              left: activeTab === "staff-list" ? "0%" : "50%",
            }}
          />
        </div>

        {/* STAFF LIST TAB */}
        {activeTab === "staff-list" && (
          <>
            {/* Refresh & Total Count */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <button onClick={handleRefresh} className="pill">
                Refresh
              </button>
              <div style={{ color: "#666" }}>
                {loading ? "Loading..." : `Total: ${allStaff.length}`}
              </div>
            </div>

            <div
              className="add-staff-form"
              style={{ opacity: adding ? 0.7 : 1 }}
            >
              <input
                type="text"
                placeholder="Name"
                value={newStaff.name}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, name: e.target.value })
                }
                disabled={adding}
              />
              <input
                type="email"
                placeholder="Email"
                value={newStaff.email}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, email: e.target.value })
                }
                disabled={adding}
              />
              <select
                value={newStaff.role}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, role: e.target.value })
                }
                disabled={adding}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={handleAddStaff} disabled={adding}>
                {adding ? "Adding..." : "Add Staff"}
              </button>
            </div>

            <div className="staff-filters">
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />

              <div className="role-pills">
                {["all", "admin", "staff"].map((role) => (
                  <button
                    key={role}
                    className={roleFilter === role ? "pill active" : "pill"}
                    onClick={() => {
                      setRoleFilter(role);
                      setPage(1);
                    }}
                  >
                    {role === "all"
                      ? "All"
                      : role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>

            </div>

            <div className="staff-list">
              {loading ? (
                <p>Loading...</p>
              ) : staffList.length > 0 ? (
                staffList.map((staff) => (
                  <div
                    key={staff._id}
                    className="staff-card"
                    style={{
                      opacity: actionLoadingIds[staff._id] ? 0.7 : 1,
                    }}
                  >
                    <div className="staff-header">
                      <div className="staff-name">
                        <strong>{staff.name}</strong>
                        <span className="email"> ({staff.email})</span>
                        {staff._id === currentUserId && (
                          <span className="you-tag">You</span>
                        )}
                      </div>
                      <span className={`role-badge ${staff.role}`}>
                        {staff.role}
                      </span>
                    </div>

                    <div className="staff-actions">
                      <div className="staff-role">
                        <label>Role:</label>
                        <select
                          value={staff.role}
                          onChange={(e) =>
                            handleRoleChange(staff._id, e.target.value)
                          }
                          disabled={!!actionLoadingIds[staff._id]}
                        >
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div
                        className="staff-status"
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <button
                          className={
                            staff.verified
                              ? "status-btn active"
                              : "status-btn inactive"
                          }
                          onClick={() => toggleVerified(staff._id)}
                          disabled={!!actionLoadingIds[staff._id]}
                        >
                          {actionLoadingIds[staff._id]
                            ? "..."
                            : staff.verified
                            ? "Active"
                            : "Inactive"}
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteStaff(staff._id, staff.name)
                          }
                          disabled={!!actionLoadingIds[staff._id]}
                          className="pill"
                          style={{ marginLeft: 8 }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-staff">No staff found.</p>
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: 12 }}>
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
          </>
        )}

        {/* STAFF PERFORMANCE TAB */}
        {activeTab === "staff-performance" && (
          <>
            <div className="staff-filters">
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="role-pills">
                {["all", "admin", "staff"].map((role) => (
                  <button
                    key={role}
                    className={roleFilter === role ? "pill active" : "pill"}
                    onClick={() => setRoleFilter(role)}
                  >
                    {role === "all"
                      ? "All"
                      : role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>

            </div>

            {/* STAFF PERFORMANCE LIST */}
            <div className="staff-list">
            {ticketsLoading ? (
  <p>Loading...</p>
) : staffPerformance.length > 0 ? (
  staffPerformance.map((staff) => (
    <div key={staff._id} className="staff-card">
      <div className="staff-header">
        <div className="staff-name">
          <strong>{staff.name}</strong>
          <span className="email"> ({staff.email})</span>
        </div>
        <span className={`role-badge ${staff.role}`}>{staff.role}</span>
      </div>

      <div className="performance-stats">
  <div className="stat-box created"> 
    <label className="stat-created">Total Tickets Created</label>
    <span className="stat-number stat-created">{staff.createdTickets}</span>
  </div>

  <div className="stat-box resolved">
    <label className="stat-resolved">Total Tickets Resolved</label>
    <span className="stat-number stat-resolved">{staff.resolvedTickets}</span>
  </div>
</div>

    </div>
  ))
) : (
  <p className="no-staff">No staff found.</p>
)}

            </div>
          </>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffManagement;
