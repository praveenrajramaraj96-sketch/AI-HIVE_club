import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AdminPortal from './pages/admin/AdminPortal';
import AdminLogin from './pages/admin/AdminLogin';
import StudentPortal from './pages/student/StudentPortal';
import StudentLogin from './pages/student/StudentLogin';
import './index.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import SplashScreen from './components/SplashScreen';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

const ProtectedRoute = ({ children, redirectTo = '/' }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const testFirebaseConnection = async () => {
      try {
        await getDocs(collection(db, "test_connection"));
        console.log("🔥 Firebase is connected successfully!");
      } catch (error) {
        if (error.code === 'permission-denied') {
          console.log("🔥 Firebase connected with correct rule restrictions.");
        } else {
          console.error("❌ Connection error:", error.message);
        }
      }
    };
    testFirebaseConnection();
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<ProtectedRoute redirectTo="/admin-login"><AdminPortal /></ProtectedRoute>} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/student/*" element={<ProtectedRoute redirectTo="/student-login"><StudentPortal /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
