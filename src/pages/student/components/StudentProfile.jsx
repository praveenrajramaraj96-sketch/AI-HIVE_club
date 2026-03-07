import React, { useState, useEffect } from 'react';
import { User, Mail, ShieldCheck, Loader2, Camera, UserSquare2, GraduationCap, Lock } from 'lucide-react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth } from '../../../firebase';
import './StudentProfile.css';

const StudentProfile = () => {
    const [profile, setProfile] = useState({ name: '', department: '', year: 'I', phone: '', email: '', role: 'Student', docId: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [updatingPassword, setUpdatingPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!auth.currentUser) return;
            setLoading(true);
            try {
                const userEmail = auth.currentUser.email;
                setProfile(prev => ({ ...prev, email: userEmail }));

                const q = query(collection(db, "students"), where("email", "==", userEmail));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const docSnap = querySnapshot.docs[0];
                    const data = docSnap.data();
                    setProfile({
                        name: data.name || '',
                        department: data.department || '',
                        year: data.year || 'I',
                        phone: data.phone || '',
                        email: userEmail,
                        role: data.role || 'Student',
                        docId: docSnap.id
                    });
                }

            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!profile.docId) {
            alert("Digital record not found. Please contact admin.");
            return;
        }
        setSaving(true);
        setSuccess('');
        try {
            const docRef = doc(db, "students", profile.docId);
            await updateDoc(docRef, {
                name: profile.name,
                department: profile.department,
                year: profile.year,
                phone: profile.phone
            });
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error("Error saving profile", error);
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        setUpdatingPassword(true);
        try {
            await updatePassword(auth.currentUser, newPassword);
            setPasswordSuccess('Password successfully updated!');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(''), 3000);
        } catch (error) {
            if (error.code === 'auth/requires-recent-login') {
                setPasswordError('Please logout and login again to change your password for security reasons.');
            } else {
                setPasswordError(error.message.replace('Firebase:', ''));
            }
        } finally {
            setUpdatingPassword(false);
        }
    };

    return (
        <div className="student-profile-page">
            <div className="page-header">
                <div>
                    <h2>My Profile</h2>
                    <p>Manage your account settings and club information.</p>
                </div>
            </div>

            <div className="profile-layout">
                {/* Left Col - Avatar */}
                <div className="glass-panel profile-sidebar">
                    <div className="avatar-wrapper">
                        {loading ? (
                            <Loader2 className="spinner" size={64} />
                        ) : (
                            <div className="avatar-huge">
                                {profile.name ? profile.name.charAt(0).toUpperCase() : <UserSquare2 size={64} className="text-muted" />}
                            </div>
                        )}
                        <button className="icon-btn camera-btn" title="Change Photo">
                            <Camera size={18} />
                        </button>
                    </div>
                    <div className="sidebar-info">
                        <h3>{profile.name || "AI-Hive Member"}</h3>
                        <p className="sidebar-email">{profile.email}</p>
                        <div className="sidebar-badge">
                            <ShieldCheck size={16} /> {profile.role}
                        </div>
                    </div>
                </div>

                {/* Right Col - Details */}
                <div className="glass-panel profile-details">
                    <h3>Personal Information</h3>
                    <form className="profile-form" onSubmit={handleSave}>
                        {success && <div className="success-banner">{success}</div>}

                        <div className="profile-grid">
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        className="input-base with-icon"
                                        value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                                        placeholder="Praveen Kumar"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Email Address (Locked)</label>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        className="input-base with-icon locked-input"
                                        value={profile.email}
                                        readOnly
                                        title="Contact Admin to change email"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Department / Branch</label>
                                <input
                                    type="text"
                                    className="input-base"
                                    value={profile.department}
                                    onChange={e => setProfile({ ...profile, department: e.target.value })}
                                    placeholder="e.g. Computer Science"
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Year of Study</label>
                                <select
                                    className="input-base"
                                    value={profile.year}
                                    onChange={e => setProfile({ ...profile, year: e.target.value })}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <option value="I">Year I</option>
                                    <option value="II">Year II</option>
                                    <option value="III">Year III</option>
                                    <option value="IV">Year IV</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Phone Number</label>
                                <input
                                    type="tel"
                                    className="input-base"
                                    value={profile.phone}
                                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                    placeholder="+91 "
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={loading || saving}>
                                {saving ? <Loader2 className="spinner" size={18} /> : 'Save Changes'}
                            </button>
                        </div>
                    </form>

                    <div className="divider" style={{ margin: '2rem 0', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}></div>

                    <h3>Change Password</h3>
                    <form className="profile-form" onSubmit={handlePasswordChange}>
                        {passwordSuccess && <div className="success-banner">{passwordSuccess}</div>}
                        {passwordError && <div className="error-message" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--pk-danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{passwordError}</div>}
                        
                        <div className="profile-grid">
                            <div className="input-group">
                                <label className="input-label">New Password</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        className="input-base with-icon"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Confirm New Password</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        className="input-base with-icon"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-secondary" disabled={updatingPassword}>
                                {updatingPassword ? <Loader2 className="spinner" size={18} /> : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
