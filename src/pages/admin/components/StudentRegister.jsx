import React, { useState } from 'react';
import { Mail, Lock, UserPlus, ArrowRight, Loader2, CheckCircle, User, Phone, Book, GraduationCap } from 'lucide-react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db, secondaryAuth } from '../../../firebase';
import './StudentRegister.css';

const StudentRegister = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('I');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await createUserWithEmailAndPassword(secondaryAuth, email, password);
            // Sign out the new user from the secondary app instance immediately
            await signOut(secondaryAuth);

            // Add student record to Firestore
            await addDoc(collection(db, "students"), {
                name: name,
                phone: phone,
                department: department,
                year: year,
                email: email,
                createdAt: new Date().toISOString(),
                status: 'Active',
                role: 'Student'
            });

            setSuccess(`Successfully created account for ${email}! They can now log in through the Student Portal.`);
            setName('');
            setPhone('');
            setDepartment('');
            setYear('I');
            setEmail('');
            setPassword('');
        } catch (err) {
            setError(err.message.replace('Firebase:', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="student-register-page">
            <div className="page-header">
                <div>
                    <h2>Register New Student</h2>
                    <p>Create credentials for new students so they can access the Student Portal.</p>
                </div>
            </div>

            <div className="glass-panel register-container">
                <form className="register-form" onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}
                    {success && (
                        <div className="success-message">
                            <CheckCircle size={20} />
                            <span>{success}</span>
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <div className="input-wrapper">
                            <User size={20} className="input-icon" />
                            <input
                                type="text"
                                className="input-base with-icon"
                                placeholder="Student Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Phone Number</label>
                        <div className="input-wrapper">
                            <Phone size={20} className="input-icon" />
                            <input
                                type="tel"
                                className="input-base with-icon"
                                placeholder="+91 9876543210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Department / Branch</label>
                        <div className="input-wrapper">
                            <Book size={20} className="input-icon" />
                            <input
                                type="text"
                                className="input-base with-icon"
                                placeholder="e.g. Computer Science"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Year of Study</label>
                        <div className="input-wrapper">
                            <GraduationCap size={20} className="input-icon" />
                            <select
                                className="input-base with-icon"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                required
                                style={{ appearance: 'none', cursor: 'pointer' }}
                            >
                                <option value="I">Year I</option>
                                <option value="II">Year II</option>
                                <option value="III">Year III</option>
                                <option value="IV">Year IV</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Student Email Address</label>
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
                        <label className="input-label">Temporary Password</label>
                        <div className="input-wrapper">
                            <Lock size={20} className="input-icon" />
                            <input
                                type="password"
                                className="input-base with-icon"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                            />
                        </div>
                        <span className="input-hint">Password must be at least 6 characters long.</span>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <Loader2 className="spinner" size={20} /> : 'Create Student Account'}
                        {!loading && <UserPlus size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentRegister;
