'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthHeader from '../components/AuthHeader';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
        const cachedUser = localStorage.getItem('apckarma-me');
        if (cachedUser) {
            try { setUser(JSON.parse(cachedUser)); } catch (e) { }
        }
        const cachedLogs = localStorage.getItem('apckarma-mylogs');
        if (cachedLogs) {
            try { setLogs(JSON.parse(cachedLogs)); } catch (e) { }
        }
    }, []);

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
            fetch('/api/logs').then(r => r.json()),
        ]).then(([userData, logsData]) => {
            if (!userData || userData.error) {
                router.push('/login');
                return;
            }
            setUser(userData);
            localStorage.setItem('apckarma-me', JSON.stringify(userData));

            const myLogs = logsData.filter(l => l.roll.toLowerCase() === userData.roll.toLowerCase());
            setLogs(myLogs);
            localStorage.setItem('apckarma-mylogs', JSON.stringify(myLogs));
            setLoading(false);
        }).catch(() => router.push('/login'));
    }, [router]);

    if (!isMounted) return null;
    if (loading && !user) return <div className="app-container"><div className="page-content" style={{ textAlign: 'center', marginTop: 80 }}><span className="text-muted font-mono">Loading...</span></div></div>;

    const approvedLogs = logs.filter(l => l.status === 'approved');
    const totalHours = approvedLogs.reduce((sum, l) => sum + l.hours, 0);
    const uniqueEvents = new Set(approvedLogs.map(l => l.company)).size;
    const karma = Math.round(totalHours * 10 + uniqueEvents * 50);

    return (
        <>
            <ThemeToggle />
            <div className="app-container">
                <AuthHeader />
                <div className="page-content">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="profile-name">{user?.name}</div>
                        <div className="profile-roll">{user?.roll}</div>
                    </div>

                    <div className="stat-grid">
                        <div className="stat-card">
                            <div className="stat-value">{karma}</div>
                            <div className="stat-label">Karma</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{totalHours}</div>
                            <div className="stat-label">Hours</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{uniqueEvents}</div>
                            <div className="stat-label">Events</div>
                        </div>
                    </div>

                    <div className="page-title" style={{ marginTop: 8 }}>My Logs</div>

                    {logs.length === 0 ? (
                        <div className="empty-state">
                            <p>No logs yet. Go log some hours!</p>
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#FFFFFF' }}>{log.company}</div>
                                        <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
                                            {timeAgo(log.timestamp) || 'Imported'}
                                        </div>
                                        <div style={{ marginTop: 6 }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)' }}>{log.hours}</span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--accent)' }}> hours</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span className={`badge badge-${log.status}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.7rem' }}>
                                            {log.status === 'pending' ? '⏳ PENDING' : log.status === 'approved' ? '✔ APPROVED' : '✖ REJECTED'}
                                        </span>
                                        {log.verification && (
                                            <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: 4 }}>
                                                by {log.verification}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <BottomNav />
        </>
    );
}
