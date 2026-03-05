import React, { useState, useEffect } from 'react';
import { Award, DownloadCloud, Loader2 } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import './StudentAchievements.css';

const StudentAchievements = () => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAchievements = async () => {
            if (!auth.currentUser) return;
            setLoading(true);
            try {
                const userEmail = auth.currentUser.email;
                const q = query(collection(db, "achievements"), where("studentEmail", "==", userEmail));
                const querySnapshot = await getDocs(q);

                const fetched = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Sort by date (newest first)
                fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setAchievements(fetched);
            } catch (error) {
                console.error("Error fetching achievements:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAchievements();
    }, []);

    const handleDownload = (certUrl) => {
        if (!certUrl) return;
        window.open(certUrl, '_blank');
    };

    return (
        <div className="student-achievements-page">
            <div className="page-header">
                <div>
                    <h2>My Achievements</h2>
                    <p>Track your certificates, badges, and milestones.</p>
                </div>
            </div>

            <div className="achievements-content">
                {loading ? (
                    <div className="loading-state glass-panel">
                        <Loader2 className="spinner" size={24} />
                        <p>Loading Certificates...</p>
                    </div>
                ) : achievements.length === 0 ? (
                    <div className="empty-state glass-panel">
                        <Award size={40} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                        <p>No achievements logged yet. Attend more hackathons and workshops!</p>
                    </div>
                ) : (
                    <div className="achievements-grid">
                        {achievements.map((item) => (
                            <div key={item.id} className="glass-panel achievement-card">
                                <div className="achievement-icon">
                                    <Award size={36} className="icon-purple" />
                                </div>
                                <div className="achievement-info">
                                    <h3>{item.title}</h3>
                                    <p className="achievement-date">{item.date}</p>
                                    <p className="achievement-desc">{item.description}</p>
                                </div>
                                <button
                                    className="btn-secondary btn-sm download-btn"
                                    onClick={() => handleDownload(item.certificateUrl)}
                                    disabled={!item.certificateUrl}
                                >
                                    <DownloadCloud size={16} />
                                    {item.certificateUrl ? 'Download Certificate' : 'No Digital File'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAchievements;
