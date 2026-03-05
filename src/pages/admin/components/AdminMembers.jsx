import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import './AdminMembers.css';

const AdminMembers = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "students"));
            const fetched = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || '',
                    email: data.email || 'Unknown',
                    phone: data.phone || 'N/A',
                    department: data.department || 'N/A',
                    role: data.role || 'Student',
                    status: data.status || 'Active',
                    joinDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Unknown'
                }
            });
            setMembers(fetched);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this student from database? (They may still be able to login if not deleted from Firebase Auth console)")) return;
        try {
            await deleteDoc(doc(db, "students", id));
            fetchMembers();
        } catch (error) {
            console.error("Error deleting student:", error);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await updateDoc(doc(db, "students", id), { status });
            fetchMembers();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const filteredMembers = members.filter(m =>
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-members-page">
            <div className="page-header">
                <div>
                    <h2>Member Management</h2>
                    <p>View all students, approve/reject membership, and assign roles.</p>
                </div>
                <div className="search-bar glass-panel">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-base"
                    />
                </div>
            </div>

            <div className="glass-panel table-container">
                <table className="members-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Contact Info</th>
                            <th>Role & Status</th>
                            <th>Join Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                    <Loader2 className="spinner" size={24} style={{ margin: '0 auto' }} />
                                </td>
                            </tr>
                        ) : filteredMembers.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No members found.
                                </td>
                            </tr>
                        ) : filteredMembers.map((member) => (
                            <tr key={member.id}>
                                <td className="member-name-cell">
                                    <div className="avatar-sm">
                                        {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{member.name || 'No Name Provided'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.department}</div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ color: 'var(--text-primary)' }}>{member.email}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.phone}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                                        <span className={`role-badge role-${member.role.toLowerCase()}`}>
                                            {member.role}
                                        </span>
                                        <span className={`status-badge status-${member.status.toLowerCase()}`}>
                                            {member.status}
                                        </span>
                                    </div>
                                </td>
                                <td>{member.joinDate}</td>
                                <td>
                                    <div className="action-icons">
                                        {member.status === 'Pending' && (
                                            <>
                                                <button className="icon-btn btn-success" title="Approve" onClick={() => handleUpdateStatus(member.id, 'Active')}><CheckCircle size={18} /></button>
                                                <button className="icon-btn btn-danger" title="Reject" onClick={() => handleUpdateStatus(member.id, 'Inactive')}><XCircle size={18} /></button>
                                            </>
                                        )}
                                        {member.status !== 'Pending' && (
                                            <button className="icon-btn btn-danger" title="Remove" onClick={() => handleDelete(member.id)}><Trash2 size={18} /></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminMembers;
