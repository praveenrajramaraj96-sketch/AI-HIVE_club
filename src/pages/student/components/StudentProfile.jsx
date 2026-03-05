import React, { useState, useEffect } from 'react';
import { User, Mail, ShieldCheck, Loader2, Camera, UserSquare2 } from 'lucide-react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import './StudentProfile.css';

const StudentProfile = () => {
    const [profile, setProfile] = useState({ name: '', department: '', phone: '', email: '', role: 'Student', docId: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

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
                phone: profile.phone
            });
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error("Error saving profile", error);
            setSaving(false);
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
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
