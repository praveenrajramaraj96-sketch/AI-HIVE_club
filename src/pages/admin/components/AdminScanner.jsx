import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, XCircle, Loader2, ShieldCheck, UserCheck } from 'lucide-react';
import { db } from '../../../firebase';

const AdminScanner = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [eventTitle, setEventTitle] = useState('');
    const [scanResult, setScanResult] = useState(null); // { success: boolean, message: string, data: any }
    const [isProcessing, setIsProcessing] = useState(false);
    const [isScannerReady, setIsScannerReady] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            const docSnap = await getDoc(doc(db, "events", eventId));
            if (docSnap.exists()) setEventTitle(docSnap.data().title);
        };
        fetchEvent();

        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true
        });

        scanner.render(onScanSuccess, onScanError);
        setIsScannerReady(true);

        return () => {
            scanner.clear().catch(err => console.error("Scanner clear failed", err));
        };
    }, [eventId]);

    const onScanSuccess = async (decodedText) => {
        if (isProcessing) return;
        handleVerification(decodedText);
    };

    const onScanError = (err) => {
        // Silently ignore regular scan failures (no QR in view)
    };

    const handleVerification = async (ticketId) => {
        setIsProcessing(true);
        setScanResult(null);

        try {
            const q = query(
                collection(db, "event_registrations"),
                where("eventId", "==", eventId),
                where("ticketId", "==", ticketId)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setScanResult({
                    success: false,
                    message: "INVALID TICKET: This ID does not exist for this event.",
                    type: "error"
                });
            } else {
                const regDoc = querySnapshot.docs[0];
                const regData = regDoc.data();

                if (regData.status !== 'Approved') {
                    setScanResult({
                        success: false,
                        message: "INACTIVE: This registration has not been Approved yet.",
                        type: "warning",
                        data: regData
                    });
                } else if (regData.checkedIn) {
                    setScanResult({
                        success: false,
                        message: "DUPLICATE: This student has already checked in!",
                        type: "warning",
                        data: regData
                    });
                } else {
                    // Success!
                    await updateDoc(doc(db, "event_registrations", regDoc.id), {
                        checkedIn: true,
                        checkedInAt: new Date().toISOString()
                    });

                    setScanResult({
                        success: true,
                        message: "ACCESS GRANTED: Welcome to the event!",
                        type: "success",
                        data: regData
                    });
                }
            }
        } catch (error) {
            console.error("Verification error:", error);
            setScanResult({
                success: false,
                message: "System Error. Please try manually.",
                type: "error"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="admin-events-page">
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <button className="btn-secondary" onClick={() => navigate(`/admin/events/${eventId}/registrations`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <h2>Event Entry Scanner</h2>
                <p style={{ color: 'var(--pk-primary)', fontWeight: 'bold' }}>{eventTitle}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 900 ? '1fr 1fr' : '1fr', gap: '2rem' }}>

                {/* Scanner Section */}
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div id="reader" style={{ borderRadius: '1rem', overflow: 'hidden', border: 'none' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Point your camera at the student's Ticket QR Code</p>
                </div>

                {/* Status Section */}
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                    {!scanResult && !isProcessing && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            <ShieldCheck size={60} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Ready to Scan...</p>
                        </div>
                    )}

                    {isProcessing && (
                        <div style={{ textAlign: 'center' }}>
                            <Loader2 className="spinner" size={40} color="var(--pk-primary)" />
                            <p style={{ marginTop: '1rem' }}>Verifying Identity...</p>
                        </div>
                    )}

                    {scanResult && (
                        <div style={{
                            textAlign: 'center',
                            padding: '2rem',
                            borderRadius: '1.5rem',
                            width: '100%',
                            background: scanResult.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : scanResult.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${scanResult.type === 'success' ? 'var(--pk-success)' : scanResult.type === 'warning' ? '#F59E0B' : 'var(--pk-danger)'}`
                        }}>
                            {scanResult.type === 'success' ? <CheckCircle size={60} color="var(--pk-success)" /> : <XCircle size={60} color={scanResult.type === 'warning' ? '#F59E0B' : 'var(--pk-danger)'} />}

                            <h3 style={{ marginTop: '1.5rem', color: scanResult.type === 'success' ? 'var(--pk-success)' : scanResult.type === 'warning' ? '#F59E0B' : 'var(--pk-danger)' }}>
                                {scanResult.message}
                            </h3>

                            {scanResult.data && (
                                <div style={{ marginTop: '2rem', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <UserCheck size={20} />
                                        <h4 style={{ margin: 0 }}>Student Details</h4>
                                    </div>
                                    <p style={{ margin: '0.2rem 0' }}><strong>Name:</strong> {scanResult.data.name}</p>
                                    <p style={{ margin: '0.2rem 0' }}><strong>Type:</strong> {scanResult.data.isMember ? 'AI-Hive Member' : 'Guest'}</p>
                                    <p style={{ margin: '0.2rem 0' }}><strong>Status:</strong> {scanResult.data.status}</p>
                                </div>
                            )}

                            <button
                                onClick={() => setScanResult(null)}
                                className="btn-primary"
                                style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}
                            >
                                Scan Next Student
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminScanner;
