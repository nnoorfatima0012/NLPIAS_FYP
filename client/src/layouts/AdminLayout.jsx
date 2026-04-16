// src/layouts/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import Footer from '../components/Footer';
import './AdminLayout.css';

const AdminLayout = () => {
  return (
    <>
      <div className="admin-layout">
        <AdminNavbar />

        <main className="admin-main">
          <div className="admin-content">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer OUTSIDE admin-layout so it can be full width */}
      <Footer />
    </>
  );
};

export default AdminLayout;
