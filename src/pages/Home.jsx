import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            {/* Dynamic Background */}
            <div className="bg-glow blur-1"></div>
            <div className="bg-glow blur-2"></div>

            <nav className="glass-panel navbar">
                <div className="logo-container">
                    <img src="/logo.png" alt="AI-Hive Logo" className="home-logo" />
                </div>
                <div className="nav-links">
                    <button className="btn-secondary" onClick={() => navigate('/student-login')}>
                        Student Login
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/admin-login')}>
                        Admin Portal
                    </button>
                </div>
            </nav>

            <main className="hero-section">
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="badge glass-panel">
                        <span className="badge-dot"></span>
                        Empowering the Future
                    </div>

                    <h2 className="hero-title">
                        Welcome to <span className="text-gradient">AI-Hive Club</span>
                    </h2>

                    <p className="hero-subtitle">
                        Join the most innovative community of AI enthusiasts. Explore, learn, build, and lead the technological revolution with us.
                    </p>

                    <div className="action-cards">
                        <motion.div
                            className="glass-panel action-card"
                            whileHover={{ scale: 1.05, y: -5 }}
                            onClick={() => navigate('/student-login')}
                        >
                            <div className="card-icon student-icon">
                                <User size={32} />
                            </div>
                            <h3>Student Portal</h3>
                            <p>Explore events, manage profile, track achievements, and participate.</p>
                            <div className="card-footer">
                                <span>Enter Portal</span>
                                <ChevronRight size={18} />
                            </div>
                        </motion.div>

                        <motion.div
                            className="glass-panel action-card"
                            whileHover={{ scale: 1.05, y: -5 }}
                            onClick={() => navigate('/admin-login')}
                        >
                            <div className="card-icon admin-icon">
                                <ShieldCheck size={32} />
                            </div>
                            <h3>Admin Portal</h3>
                            <p>Manage members, events, gallery, and club announcements.</p>
                            <div className="card-footer">
                                <span>Access Admin</span>
                                <ChevronRight size={18} />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default Home;
