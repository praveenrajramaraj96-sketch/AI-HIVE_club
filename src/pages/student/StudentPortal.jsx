import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, User, Award, MessageCircle, LogOut, Menu, X } from 'lucide-react';
import StudentDashboard from './components/StudentDashboard';
import StudentEvents from './components/StudentEvents';
import StudentProfile from './components/StudentProfile';
import StudentAchievements from './components/StudentAchievements';
import StudentContact from './components/StudentContact';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import './StudentPortal.css';

const StudentPortal = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    const isActive = (path) => location.pathname.includes(path) ? 'active' : '';

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/student-login');
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
                    <h2>Student Hub</h2>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/student/dashboard" className={`nav-item ${isActive('dashboard')}`} onClick={closeSidebar}>
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>
                    <Link to="/student/events" className={`nav-item ${isActive('events')}`} onClick={closeSidebar}>
                        <Calendar size={20} />
                        Events
                    </Link>
                    <Link to="/student/profile" className={`nav-item ${isActive('profile')}`} onClick={closeSidebar}>
                        <User size={20} />
                        Profile
                    </Link>
                    <Link to="/student/achievements" className={`nav-item ${isActive('achievements')}`} onClick={closeSidebar}>
                        <Award size={20} />
                        Achievements
                    </Link>
                    <Link to="/student/contact" className={`nav-item ${isActive('contact')}`} onClick={closeSidebar}>
                        <MessageCircle size={20} />
                        Contact Admin
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
                        <h2>Welcome, Explorer</h2>
                    </div>
                    <div className="header-actions">
                        <img src="/logo.png" alt="AI Hive Logo" className="avatar-img" />
                    </div>
                </div>

                <div className="content-area">
                    <Routes>
                        <Route path="/" element={<StudentDashboard />} />
                        <Route path="dashboard" element={<StudentDashboard />} />
                        <Route path="events" element={<StudentEvents />} />
                        <Route path="profile" element={<StudentProfile />} />
                        <Route path="achievements" element={<StudentAchievements />} />
                        <Route path="contact" element={<StudentContact />} />
                    </Routes>
                </div>
            </main>
        </div >
    );
};

export default StudentPortal;
