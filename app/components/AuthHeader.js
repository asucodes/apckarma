'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthHeader() {
    const [user, setUser] = useState(null);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
        const cached = localStorage.getItem('apckarma-me');
        if (cached) {
            try { setUser(JSON.parse(cached)); } catch (e) { }
        }

        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data && !data.error) {
                    setUser(data);
                    localStorage.setItem('apckarma-me', JSON.stringify(data));
                }
                else router.push('/login');
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (!isMounted) return null;
    if (!user) return null;

    return (
        <header className="app-header">
            <div className="auth-logo-header">
                <img src="/apckarma_white.png" alt="APC Karma" className="auth-logo-img" />
                <div className="auth-logo-text">APC Karma</div>
            </div>
            <div className="auth-subline">
                <span className="admin-text">{user.name}</span>
                <span style={{ color: 'var(--border-light)' }}>|</span>
                <button className="logout-btn" onClick={handleLogout}>LOGOUT</button>
            </div>
        </header>
    );
}
