'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function AdminPage() {
    const [logs, setLogs] = useState([]);
    const [events, setEvents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approver, setApprover] = useState('');
    const [newEventName, setNewEventName] = useState('');
    const [toast, setToast] = useState(null);
    const [expandedEvents, setExpandedEvents] = useState({});
    // Rapid entry
    const [rapidRoll, setRapidRoll] = useState('');
    const [rapidEvent, setRapidEvent] = useState('');
    const [rapidHours, setRapidHours] = useState('');
    // Password reset
    const [resetRoll, setResetRoll] = useState('');
    const [resetPassword, setResetPassword] = useState('');

    const router = useRouter();

    useEffect(() => {
        const saved = sessionStorage.getItem('apckarma-approver');
        if (saved) setApprover(saved);

        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data || data.role !== 'admin') { router.push('/login'); return; }
                return loadData();
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const loadData = async () => {
        try {
            const [logsRes, eventsRes, volsRes] = await Promise.all([
                fetch('/api/admin/logs').then(r => r.json()),
                fetch('/api/events').then(r => r.json()),
                fetch('/api/volunteers').then(r => r.json()),
            ]);
            setLogs(logsRes);
            setEvents(eventsRes);
            setVolunteers(volsRes);
        } catch { } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, isError = false) => {
        setToast({ message: msg, isError });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSetApprover = (name) => {
        setApprover(name);
        sessionStorage.setItem('apckarma-approver', name);
    };

    const handleApprove = async (logId) => {
        if (!approver) { showToast('Set approver name first', true); return; }
        const res = await fetch('/api/admin/approve', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logId, approver }),
        });
        if (res.ok) { showToast('✅ Approved'); loadData(); }
        else showToast('Failed to approve', true);
    };

    const handleReject = async (logId) => {
        if (!approver) { showToast('Set approver name first', true); return; }
        const res = await fetch('/api/admin/reject', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logId, approver }),
        });
        if (res.ok) { showToast('❌ Rejected'); loadData(); }
        else showToast('Failed to reject', true);
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!newEventName.trim()) return;
        const res = await fetch('/api/admin/create-event', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newEventName.trim() }),
        });
        if (res.ok) { showToast('✅ Event created'); setNewEventName(''); loadData(); }
        else showToast('Failed to create event', true);
    };

    const handleRapidEntry = async (e) => {
        e.preventDefault();
        if (!rapidRoll || !rapidEvent || !rapidHours) return;
        const res = await fetch('/api/admin/manual-log', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roll: rapidRoll, company: rapidEvent, hours: parseFloat(rapidHours) }),
        });
        if (res.ok) { showToast('✅ Log added'); setRapidRoll(''); setRapidEvent(''); setRapidHours(''); loadData(); }
        else showToast('Failed to add log', true);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetRoll || !resetPassword) return;
        const res = await fetch('/api/admin/reset-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roll: resetRoll, newPassword: resetPassword }),
        });
        if (res.ok) { showToast('✅ Password reset'); setResetRoll(''); setResetPassword(''); }
        else showToast('Failed to reset password', true);
    };

    // Group logs by event
    const logsByEvent = {};
    logs.forEach(log => {
        const key = log.company || 'Unknown';
        if (!logsByEvent[key]) logsByEvent[key] = [];
        logsByEvent[key].push(log);
    });

    // Open events
    const now = new Date();
    const openEvents = events.filter(e => {
        const created = new Date(e.createdAt);
        return (now - created) / (1000 * 60 * 60 * 24) <= 3;
    });

    if (loading) return <div className="loading">Loading</div>;

    return (
        <>
            <ThemeToggle />
            <div className="app-container">
                <header className="app-header">
                    <div className="user-info">
                        <span className="user-roll">ADMIN</span>
                        <span>· Dashboard</span>
                    </div>
                    <button className="btn-logout" onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        router.push('/login');
                    }}>Logout</button>
                </header>

                {/* Approver Prompt */}
                <div className="approver-prompt">
                    <label>Who is approving today?</label>
                    <input
                        type="text"
                        className="form-input mt-8"
                        placeholder="Enter your name"
                        value={approver}
                        onChange={(e) => handleSetApprover(e.target.value)}
                    />
                </div>

                {/* Create Event */}
                <div className="admin-section">
                    <div className="admin-section-title">📅 Create Event</div>
                    <form onSubmit={handleCreateEvent} style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Event name (e.g. Company Campus Visit)"
                            value={newEventName}
                            onChange={(e) => setNewEventName(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '10px 16px' }}>+</button>
                    </form>
                </div>

                <div className="divider" />

                {/* Logs by Event */}
                <div className="admin-section">
                    <div className="admin-section-title">📋 Recent Logs</div>
                    {Object.keys(logsByEvent).length === 0 ? (
                        <div className="empty-state"><p>No logs yet</p></div>
                    ) : (
                        Object.entries(logsByEvent).map(([eventName, eventLogs]) => {
                            const pendingCount = eventLogs.filter(l => l.status === 'pending').length;
                            const isExpanded = expandedEvents[eventName];
                            return (
                                <div key={eventName} className="event-group">
                                    <div
                                        className="event-group-title"
                                        onClick={() => setExpandedEvents(prev => ({ ...prev, [eventName]: !prev[eventName] }))}
                                    >
                                        <span>{eventName} ({eventLogs.length})</span>
                                        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            {pendingCount > 0 && <span className="badge badge-pending">{pendingCount} pending</span>}
                                            <span>{isExpanded ? '▾' : '▸'}</span>
                                        </span>
                                    </div>
                                    {isExpanded && eventLogs.map(log => (
                                        <div key={log.id} className="admin-log-item">
                                            <div className="admin-log-info">
                                                <div className="admin-log-name">{log.name}</div>
                                                <div className="admin-log-detail">
                                                    {log.roll} · {log.hours}h · {timeAgo(log.timestamp)} · <span className={`badge badge-${log.status}`}>{log.status}</span>
                                                    {log.verification && <span> · by {log.verification}</span>}
                                                </div>
                                            </div>
                                            {log.status === 'pending' && (
                                                <div className="admin-actions">
                                                    <button className="btn-icon approve" onClick={() => handleApprove(log.id)} title="Approve">✓</button>
                                                    <button className="btn-icon reject" onClick={() => handleReject(log.id)} title="Reject">✕</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="divider" />

                {/* Rapid Entry */}
                <div className="admin-section">
                    <div className="admin-section-title">⚡ Rapid Entry Log</div>
                    <form onSubmit={handleRapidEntry}>
                        <div className="form-group">
                            <label className="form-label">APC</label>
                            <select className="form-select" value={rapidRoll} onChange={(e) => setRapidRoll(e.target.value)} required>
                                <option value="">-- Select APC --</option>
                                {volunteers.map(v => (
                                    <option key={v.roll} value={v.roll}>{v.name} ({v.roll})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Event</label>
                            <select className="form-select" value={rapidEvent} onChange={(e) => setRapidEvent(e.target.value)} required>
                                <option value="">-- Select event --</option>
                                {openEvents.map((ev, i) => (
                                    <option key={i} value={ev.name}>{ev.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Hours</label>
                            <input type="number" className="form-input" placeholder="e.g. 2" value={rapidHours} onChange={(e) => setRapidHours(e.target.value)} min="0.5" max="24" step="0.5" required />
                        </div>
                        <button type="submit" className="btn btn-primary">Add Log</button>
                    </form>
                </div>

                <div className="divider" />

                {/* Password Reset */}
                <div className="admin-section">
                    <div className="admin-section-title">🔑 Password Reset</div>
                    <form onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <label className="form-label">Roll Number</label>
                            <input type="text" className="form-input" placeholder="e.g. 2024UCS1501" value={resetRoll} onChange={(e) => setResetRoll(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input type="text" className="form-input" placeholder="New password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-danger" style={{ width: '100%' }}>Reset Password</button>
                    </form>
                </div>
            </div>
            <BottomNav />
            {toast && <div className={`toast ${toast.isError ? 'error' : ''}`}>{toast.message}</div>}
        </>
    );
}
