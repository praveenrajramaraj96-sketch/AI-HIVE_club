import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Image as ImageIcon, Bell, MessageSquare, LogOut, Menu, X, Award } from 'lucide-react';
import DashboardOverview from './components/DashboardOverview';
import AdminMembers from './components/AdminMembers';
import StudentRegister from './components/StudentRegister';
import AdminEvents from './components/AdminEvents';
import AdminAnnouncements from './components/AdminAnnouncements';
import AdminGallery from './components/AdminGallery';
import AdminAchievements from './components/AdminAchievements';
import AdminContacts from './components/AdminContacts';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import './AdminPortal.css';

const AdminPortal = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    const isActive = (path) => location.pathname.includes(path) ? 'active' : '';

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/admin-login');
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <div className="portal-layout">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div className="mobile-overlay" onClick={closeSidebar}></div>
            )}

            {/* Sidebar */}
            <aside className={`glass-panel sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Admin Hub</h2>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/admin/dashboard" className={`nav-item ${isActive('dashboard')}`} onClick={closeSidebar}>
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>
                    <Link to="/admin/register-student" className={`nav-item ${isActive('register-student')}`} onClick={closeSidebar}>
                        <Users size={20} />
                        Register Student
                    </Link>
                    <Link to="/admin/members" className={`nav-item ${isActive('members')}`} onClick={closeSidebar}>
                        <Users size={20} />
                        Members
                    </Link>
                    <Link to="/admin/events" className={`nav-item ${isActive('events')}`} onClick={closeSidebar}>
                        <Calendar size={20} />
                        Events
                    </Link>
                    <Link to="/admin/gallery" className={`nav-item ${isActive('gallery')}`} onClick={closeSidebar}>
                        <ImageIcon size={20} />
                        Gallery
                    </Link>
                    <Link to="/admin/announcements" className={`nav-item ${isActive('announcements')}`} onClick={closeSidebar}>
                        <Bell size={20} />
                        Announcements
                    </Link>
                    <Link to="/admin/achievements" className={`nav-item ${isActive('achievements')}`} onClick={closeSidebar}>
                        <Award size={20} />
                        Achievements
                    </Link>
                    <Link to="/admin/contacts" className={`nav-item ${isActive('contacts')}`} onClick={closeSidebar}>
                        <MessageSquare size={20} />
                        Contacts
                    </Link>
                </nav>
                <div className="sidebar-footer">
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="portal-content">
                <div className="portal-header glass-panel">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={toggleSidebar}>
                            <Menu size={24} />
                        </button>
                        <h2>Welcome, Admin Manager</h2>
                    </div>
                    <div className="header-actions">
                        <img src="/logo.png" alt="AI Hive Logo" className="avatar-img" />
                    </div>
                </div>

                <div className="content-area">
                    <Routes>
                        <Route path="/" element={<DashboardOverview />} />
                        <Route path="dashboard" element={<DashboardOverview />} />
                        <Route path="register-student" element={<StudentRegister />} />
                        <Route path="members" element={<AdminMembers />} />
                        <Route path="events" element={<AdminEvents />} />
                        <Route path="gallery" element={<AdminGallery />} />
                        <Route path="announcements" element={<AdminAnnouncements />} />
                        <Route path="achievements" element={<AdminAchievements />} />
                        <Route path="contacts" element={<AdminContacts />} />
                        <Route path="*" element={<DashboardOverview />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default AdminPortal;
