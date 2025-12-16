import React from "react";
import { Outlet } from "react-router-dom";
import logo from "../assets/image-removebg-preview.png"; // keep your logo in src/assets/logo.png

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex flex-col items-center p-4 shadow-md bg-white">
        <img src={logo} alt="Chippy Inn Logo" className="h-16 mb-2" />
        <h1 className="text-xl font-bold">Chippy Inn</h1>
      </header>

      {/* Page Content */}
      <main className="flex-grow flex justify-center items-center bg-gray-50">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="p-4 text-center bg-gray-200">
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} Chippy Inn. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Layout;
