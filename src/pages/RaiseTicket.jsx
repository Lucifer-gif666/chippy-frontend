// src/pages/RaiseTicket.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StaffLayout from "../layout/StaffLayout";
import "../styles/RaiseTicket.css";
import { showBrowserNotification } from "../utils/browserNotifications";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const RaiseTicket = ({ handleNotificationRead }) => {
  const [zones, setZones] = useState([]);
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ NEW

  const [formData, setFormData] = useState({
    zoneId: "",
    branchIndex: "",
    roomNo: "",
    priority: "Low",
    remarks: "",
  });

  const navigate = useNavigate();
  const currentStaff = JSON.parse(localStorage.getItem("currentStaff"));

  // Fetch zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/zones`);
        setZones(res.data);
      } catch (err) {
        console.error("Failed to fetch zones", err);
      }
    };
    fetchZones();
  }, []);

  // Update branches
  useEffect(() => {
    if (formData.zoneId) {
      const selectedZone = zones.find((z) => z._id === formData.zoneId);
      setBranches(selectedZone ? selectedZone.branches : []);
      setFormData((prev) => ({ ...prev, branchIndex: "", roomNo: "" }));
      setRooms([]);
    }
  }, [formData.zoneId, zones]);

  // Update rooms
  useEffect(() => {
    if (formData.branchIndex !== "" && branches.length > 0) {
      setRooms(branches[formData.branchIndex]?.rooms || []);
      setFormData((prev) => ({ ...prev, roomNo: "" }));
    }
  }, [formData.branchIndex, branches]);

  const handleChange = (e) => {
    if (isSubmitting) return; // ✅ prevent changes while submitting
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ HARD GUARD (prevents double click)
    if (isSubmitting) return;

    if (!formData.remarks.trim()) {
      toast.error("Remarks is required!");
      return;
    }

    setIsSubmitting(true); // 🔒 LOCK SUBMISSION

    try {
      const selectedZone = zones.find((z) => z._id === formData.zoneId);
      const selectedBranch = selectedZone?.branches[formData.branchIndex];

      // Get last ticket
      const lastTickets = await axios.get(`${API_BASE_URL}/api/tickets`);
      const lastId = lastTickets.data.length
        ? lastTickets.data[0].ticketId.replace("TKT", "")
        : 0;

      const ticketId = "TKT" + String(Number(lastId) + 1).padStart(3, "0");

      const ticketData = {
        ticketId,
        createdBy: currentStaff.name,
        currentStaffId: currentStaff._id,
        zoneNo: selectedZone?.name || "",
        apartmentName: selectedBranch?.name || "",
        roomNo: formData.roomNo,
        priority: formData.priority,
        remarks: formData.remarks,
        status: "Pending",
        createdDate: new Date().toISOString().split("T")[0],
        createdTime: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      const res = await axios.post(`${API_BASE_URL}/api/tickets`, ticketData);

      // 🔕 Mobile-safe notification
      try {
        if (Notification.permission === "granted") {
          showBrowserNotification(
            "Ticket Created",
            `${currentStaff.name} created ticket ${res.data.ticketId}`
          );
        }
      } catch {}

      if (handleNotificationRead) handleNotificationRead();

      toast.success(`Ticket ${ticketId} created successfully!`);

      // Reset form
      setFormData({
        zoneId: "",
        branchIndex: "",
        roomNo: "",
        priority: "Low",
        remarks: "",
      });
      setBranches([]);
      setRooms([]);

      // ✅ Navigate immediately
      navigate("/staff-dashboard", {
        state: { refresh: true, newTicketId: ticketId },
      });
    } catch (err) {
      console.error("Ticket creation error:", err);
      toast.error("Failed to create ticket!");
    } finally {
      setIsSubmitting(false); // 🔓 UNLOCK (safety)
    }
  };

  return (
    <StaffLayout>
      <h2 className="page-title">Raise Ticket</h2>
      <div className="raise-ticket-container">
        <form className="ticket-form" onSubmit={handleSubmit}>
          <label>
            Created By:
            <input type="text" value={currentStaff.name} readOnly />
          </label>

          <label>
            Zone:
            <select
              name="zoneId"
              value={formData.zoneId}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            >
              <option value="">Select Zone</option>
              {zones.map((zone) => (
                <option key={zone._id} value={zone._id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Branch:
            <select
              name="branchIndex"
              value={formData.branchIndex}
              onChange={handleChange}
              required
              disabled={!branches.length || isSubmitting}
            >
              <option value="">Select Branch</option>
              {branches.map((branch, idx) => (
                <option key={idx} value={idx}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Room:
            <select
              name="roomNo"
              value={formData.roomNo}
              onChange={handleChange}
              required
              disabled={!rooms.length || isSubmitting}
            >
              <option value="">Select Room</option>
              {rooms.map((room, idx) => (
                <option key={idx} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </label>

          <label>
            Priority:
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </label>

          <label>
            Remarks:
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </label>

          <button
            type="submit"
            className={`submit-btn ${isSubmitting ? "disabled-btn" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Ticket"}
          </button>
        </form>
      </div>
    </StaffLayout>
  );
};

export default RaiseTicket;
