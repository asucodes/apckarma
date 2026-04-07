'use client';
import { useState, useEffect } from 'react';

export default function SplashScreen() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#151515', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '40px 0' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                    src="/apckarma_white.png"
                    alt="Loading..."
                    style={{
                        width: 160, height: 160, objectFit: 'contain',
                        filter: 'drop-shadow(0 0 24px rgba(59, 130, 246, 0.45)) drop-shadow(0 0 12px rgba(59, 130, 246, 0.2))',
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }}
                />
            </div>
            <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                APC Karma
            </div>
        </div>
    );
}
