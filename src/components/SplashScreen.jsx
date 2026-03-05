import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        // Start fading out after 2.5 seconds
        const fadeTimer = setTimeout(() => {
            setIsFading(true);
        }, 2500);

        // Complete the splash screen after 3 seconds total (0.5s fade duration)
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 3000);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div className={`splash-screen ${isFading ? 'fade-out' : ''}`}>
            <div className="splash-content">
                <div className="logo-container pulse-animation">
                    <img src="/logo.png" alt="AI Hive Club Logo" className="splash-logo" />
                </div>
                <h1 className="splash-title">AI HIVE CLUB</h1>
                <p className="splash-subtitle">Empowering the Future</p>
            </div>
        </div>
    );
};

export default SplashScreen;
