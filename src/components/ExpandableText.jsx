import React from "react";

const ExpandableText = ({ text }) => {
  return (
    <div
      className="expandable-text"
      style={{
        lineHeight: "1.5rem",
        whiteSpace: "pre-wrap", // keeps line breaks
        wordBreak: "break-word", // prevents overflow
      }}
    >
      {text}
    </div>
  );
};

export default ExpandableText;