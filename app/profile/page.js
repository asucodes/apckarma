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
    const router = useRouter();

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
            const myLogs = logsData.filter(l => l.roll.toLowerCase() === userData.roll.toLowerCase());
            setLogs(myLogs);
            setLoading(false);
        }).catch(() => router.push('/login'));
    }, [router]);

    if (loading || !user) return <div className="loading">Loading</div>;

    const approvedLogs = logs.filter(l => l.status === 'approved');
    const totalHours = approvedLogs.reduce((sum, l) => sum + l.hours, 0);
    const uniqueEvents = new Set(approvedLogs.map(l => l.company)).size;
    const karma = Math.round(totalHours * 10 + uniqueEvents * 50);

    return (
        <>
            <ThemeToggle />
            <div className="app-container">
                <AuthHeader />

                <div className="profile-header">
                    <div className="profile-avatar">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="profile-name">{user.name}</div>
                    <div className="profile-roll">{user.roll}</div>
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

                <h2 className="page-title" style={{ fontSize: '1rem' }}>My Logs</h2>

                {logs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <p>No logs yet. Go log some hours!</p>
                    </div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.company}</div>
                                    <div className="text-muted font-mono" style={{ fontSize: '0.75rem' }}>
                                        {log.hours}h · {timeAgo(log.timestamp)}
                                    </div>
                                </div>
                                <div>
                                    <span className={`badge badge-${log.status}`}>{log.status}</span>
                                    {log.verification && (
                                        <div className="text-muted font-mono" style={{ fontSize: '0.65rem', marginTop: 2 }}>
                                            by {log.verification}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <BottomNav />
        </>
    );
}
