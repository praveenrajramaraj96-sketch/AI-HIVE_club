import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import './StudentLogin.css';

const StudentLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/student/dashboard');
        } catch (err) {
            setError(err.message.replace('Firebase:', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Dynamic Background matching Home */}
            <div className="bg-glow blur-1"></div>
            <div className="bg-glow blur-2"></div>

            <motion.div
                className="glass-panel login-box"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="login-header">
                    <div className="logo-icon-wrap">
                        <Zap size={32} />
                    </div>
                    <h2>Welcome Back</h2>
                    <p>Sign in to your student portal</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={20} className="input-icon" />
                            <input
                                type="email"
                                className="input-base with-icon"
                                placeholder="student@college.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div className="input-wrapper">
                            <Lock size={20} className="input-icon" />
                            <input
                                type="password"
                                className="input-base with-icon"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary login-btn" disabled={loading}>
                        {loading ? <Loader2 className="spinner" size={20} /> : 'Sign In'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

            </motion.div>
        </div>
    );
};

export default StudentLogin;
