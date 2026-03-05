import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldAlert, ArrowRight, Loader2, Key } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import './AdminLogin.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // This is a simple prototype safeguard. In production, use Firebase Custom Claims.
    const SUPERADMIN_SECRET = "AIHIVE2026";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                // Login Flow
                await signInWithEmailAndPassword(auth, email, password);
                navigate('/admin/dashboard');
            } else {
                // Create Superadmin Flow
                if (secretKey !== SUPERADMIN_SECRET) {
                    throw new Error("Invalid Superadmin Secret Key!");
                }
                await createUserWithEmailAndPassword(auth, email, password);
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.message.replace('Firebase:', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="bg-glow blur-1"></div>
            <div className="bg-glow blur-2"></div>

            <motion.div
                className="glass-panel admin-login-box"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="admin-login-header">
                    <div className="admin-icon-wrap">
                        <ShieldAlert size={36} />
                    </div>
                    <h2>{isLogin ? 'Admin Access' : 'Create Superadmin'}</h2>
                    <p>{isLogin ? 'Authenticate to access the admin portal' : 'Initialize the master admin account'}</p>
                </div>

                <form className="admin-login-form" onSubmit={handleSubmit}>
                    {error && <div className="admin-error-message">{error}</div>}

                    <div className="admin-input-group">
                        <label className="admin-input-label">Admin Email</label>
                        <div className="admin-input-wrapper">
                            <Mail size={20} className="admin-input-icon" />
                            <input
                                type="email"
                                className="admin-input-base"
                                placeholder="superadmin@aihive.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="admin-input-group">
                        <label className="admin-input-label">Password</label>
                        <div className="admin-input-wrapper">
                            <Lock size={20} className="admin-input-icon" />
                            <input
                                type="password"
                                className="admin-input-base"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="admin-input-group">
                            <label className="admin-input-label">Superadmin Secret Key</label>
                            <div className="admin-input-wrapper">
                                <Key size={20} className="admin-input-icon" />
                                <input
                                    type="password"
                                    className="admin-input-base"
                                    placeholder="Enter authorization key"
                                    value={secretKey}
                                    onChange={(e) => setSecretKey(e.target.value)}
                                    required
                                />
                            </div>
                            <span className="admin-hint">Required to create a master account. Use: AIHIVE2026</span>
                        </div>
                    )}

                    <button type="submit" className="btn-primary admin-login-btn" disabled={loading}>
                        {loading ? <Loader2 className="spinner" size={20} /> : (isLogin ? 'Secure Sign In' : 'Initialize Admin')}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <p>
                        {isLogin ? "Need to setup the master account? " : "Already have master access? "}
                        <span onClick={() => { setIsLogin(!isLogin); setError(''); }} className="admin-toggle-link">
                            {isLogin ? 'Create Superadmin' : 'Login instead'}
                        </span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
