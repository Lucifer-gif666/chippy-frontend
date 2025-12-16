// src/pages/ZoneManagement.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import StaffLayout from "../layout/StaffLayout";
import "../styles/ZoneManagement.css";

const ZoneManagement = () => {
  const [zones, setZones] = useState([]);
  const [expandedZone, setExpandedZone] = useState(null);
  const [newZoneName, setNewZoneName] = useState("");

  // Fetch zones from MongoDB on page load
  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/zones");
      setZones(res.data);
    } catch (err) {
      console.error("Failed to fetch zones:", err);
    }
  };

  // Add new Zone
  const handleAddZone = async () => {
    if (!newZoneName.trim()) return;
    try {
      const res = await axios.post("http://localhost:5000/api/zones", { name: newZoneName });
      setZones([...zones, res.data]);
      setNewZoneName("");
    } catch (err) {
      console.error("Failed to add zone:", err);
    }
  };

  // Add new Branch
  const handleAddBranch = async (zoneIndex, branchName) => {
    if (!branchName.trim()) return;
    try {
      const res = await axios.post(
        `http://localhost:5000/api/zones/${zones[zoneIndex]._id}/branches`,
        { branchName }
      );
      const updatedZones = [...zones];
      updatedZones[zoneIndex] = res.data;
      setZones(updatedZones);
    } catch (err) {
      console.error("Failed to add branch:", err);
    }
  };

  // Add new Room
  const handleAddRoom = async (zoneIndex, branchIndex, roomName) => {
    if (!roomName.trim()) return;
    try {
      const res = await axios.post(
        `http://localhost:5000/api/zones/${zones[zoneIndex]._id}/branches/${branchIndex}/rooms`,
        { roomName }
      );
      const updatedZones = [...zones];
      updatedZones[zoneIndex] = res.data;
      setZones(updatedZones);
    } catch (err) {
      console.error("Failed to add room:", err);
    }
  };

  return (
    <StaffLayout>
      <div className="zone-management-container">
        <h2 className="page-title">Zone Management</h2>

        {/* Add New Zone */}
        <div className="add-zone-form">
          <input
            type="text"
            placeholder="New Zone Name"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
          />
          <button onClick={handleAddZone}>Add Zone</button>
        </div>

        {/* Zones Accordion */}
        <div className="zones-list">
          {zones.map((zone, zIdx) => (
            <div key={zone._id} className="zone-card">
              <div
                className="zone-header"
                onClick={() =>
                  setExpandedZone(expandedZone === zIdx ? null : zIdx)
                }
              >
                {zone.name}
              </div>

              {expandedZone === zIdx && (
                <div className="zone-body">
                  {zone.branches.map((branch, bIdx) => (
                    <div key={bIdx} className="branch-card">
                      <div className="branch-header">{branch.name}</div>
                      <div className="rooms-list">
                        {branch.rooms.map((room, rIdx) => (
                          <span key={rIdx} className="room-badge">
                            {room}
                          </span>
                        ))}
                        <AddRoomForm
                          zoneIndex={zIdx}
                          branchIndex={bIdx}
                          onAddRoom={handleAddRoom}
                        />
                      </div>
                    </div>
                  ))}
                  <AddBranchForm zoneIndex={zIdx} onAddBranch={handleAddBranch} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </StaffLayout>
  );
};

// Add Branch Form
const AddBranchForm = ({ zoneIndex, onAddBranch }) => {
  const [branchName, setBranchName] = useState("");
  return (
    <div className="add-branch-form">
      <input
        type="text"
        placeholder="New Branch Name"
        value={branchName}
        onChange={(e) => setBranchName(e.target.value)}
      />
      <button
        onClick={() => {
          onAddBranch(zoneIndex, branchName);
          setBranchName("");
        }}
      >
        Add Branch
      </button>
    </div>
  );
};

// Add Room Form
const AddRoomForm = ({ zoneIndex, branchIndex, onAddRoom }) => {
  const [roomName, setRoomName] = useState("");
  return (
    <div className="add-room-form">
      <input
        type="text"
        placeholder="New Room Name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />
      <button
        onClick={() => {
          onAddRoom(zoneIndex, branchIndex, roomName);
          setRoomName("");
        }}
      >
        Add Room
      </button>
    </div>
  );
};

export default ZoneManagement;
