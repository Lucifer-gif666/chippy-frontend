import React, { useState, useRef, useEffect } from "react";
import "../styles/StaffDashboard.css";
import "../styles/AssignTickets.css";

const ExpandableText = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      // Check if text overflows
      setIsOverflowing(el.scrollHeight > el.clientHeight);
    }
  }, [text]);

  const toggleExpand = (e) => {
    e.stopPropagation(); // avoid triggering card click
    setExpanded((prev) => !prev);
  };

  return (
    <div className="expandable-text-wrapper">
      <div
        ref={textRef}
        className={`expandable-text ${expanded ? "expanded" : ""}`}
        style={{
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: expanded ? "unset" : 2, // 2 lines when collapsed
          lineHeight: "1.5rem",
        }}
      >
        {text}
      </div>

      {isOverflowing && (
        <span
          onClick={toggleExpand}
          className="expand-toggle"
          style={{
            fontWeight: "bold",
            color: "#007bff",
            cursor: "pointer",
            display: "inline-block",
            marginTop: "4px",
          }}
        >
          {expanded ? "Show Less" : "Show More"}
        </span>
      )}
    </div>
  );
};

export default ExpandableText;
