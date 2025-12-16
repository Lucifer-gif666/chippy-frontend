// src/ReusableComp/ClosedTicketWrapper.jsx
import React, { useState, useEffect, useRef } from "react";
import "../styles/ClosedTicketWrapper.css";

const ClosedTicketWrapper = ({ status, children, ticketId }) => {
  const [flipped, setFlipped] = useState(false);
  const [isLarge, setIsLarge] = useState(window.innerWidth > 768); // desktop check
  const wrapperRef = useRef(null);
  const backRef = useRef(null);
  const frontRef = useRef(null);

  const isClosed = status?.toLowerCase() === "closed";

  /** MOBILE TAP FLIP */
  const handleMobileFlip = (e) => {
    if (!isClosed) return;
    e.stopPropagation();
    setFlipped((prev) => !prev);
  };

  /** DESKTOP HOVER FLIP */
  const handleHoverFlip = () => {
    if (isClosed) setFlipped(true);
  };

  const handleHoverUnflip = () => {
    if (isClosed) setFlipped(false);
  };

  /** TAP OUTSIDE TO CLOSE (Mobile only) */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isLarge) {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
          setFlipped(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLarge]);

  /** AUTO HEIGHT */
  useEffect(() => {
    if (!wrapperRef.current) return;

    const frontHeight = frontRef.current?.offsetHeight || 0;
    const backHeight = backRef.current?.scrollHeight || 0;

    wrapperRef.current.style.transition = "height 0.3s ease";

    wrapperRef.current.style.height = flipped
      ? backHeight + "px"
      : frontHeight + "px";
  }, [flipped]);

  /** HANDLE SCREEN RESIZE */
  useEffect(() => {
    const handleResize = () => setIsLarge(window.innerWidth > 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isClosed) return <>{children}</>;

  return (
    <div
      className={`closed-ticket-wrapper ${flipped ? "flipped" : ""}`}
      ref={wrapperRef}
      onClick={!isLarge ? handleMobileFlip : undefined}
      onMouseEnter={isLarge ? handleHoverFlip : undefined}
      onMouseLeave={isLarge ? handleHoverUnflip : undefined}
    >
      <div className="closed-inner">
        {/* FRONT SUMMARY */}
        <div className="closed-face closed-face-front" ref={frontRef}>
          <div className="closed-back-box">
            <div className="closed-back-big">CLOSED</div>
            <div className="closed-back-id">#{ticketId}</div>
          </div>
        </div>

        {/* BACK FULL CARD */}
        <div className="closed-face closed-face-back" ref={backRef}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ClosedTicketWrapper;
