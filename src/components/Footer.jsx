// src/components/Footer.jsx
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-center py-4 mt-10 border-t">
      <p className="text-gray-600 text-sm">
        © {new Date().getFullYear()} Chippy Inn. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
