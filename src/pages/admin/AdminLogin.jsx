import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import './AdminLogin.css';

const AdminLogin = () => {
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

            // Check if user is a student
            const q = query(collection(db, "students"), where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                await signOut(auth);
                throw new Error("Access Denied: Students are not permitted in the Admin portal.");
            }

            navigate('/admin/dashboard');
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
                    <h2>Admin Access</h2>
                    <p>Authenticate to access the admin portal</p>
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

                    <button type="submit" className="btn-primary admin-login-btn" disabled={loading}>
                        {loading ? <Loader2 className="spinner" size={20} /> : 'Secure Sign In'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
