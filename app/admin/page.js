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
    const [logs, setLogs] = useState(() => {
        if (typeof window === 'undefined') return [];
        try {
            const cached = localStorage.getItem('apckarma-admin-logs');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch {
            /* ignore */
        }
        return [];
    });
    const [events, setEvents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(false);
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

    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
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
        const asArray = async (r) => {
            const j = await r.json();
            return r.ok && Array.isArray(j) ? j : [];
        };
        try {
            const [logsRes, eventsRes, volsRes] = await Promise.all([
                fetch('/api/admin/logs').then(asArray),
                fetch('/api/events').then(asArray),
                fetch('/api/volunteers').then(asArray),
            ]);
            setLogs(logsRes);
            try {
                localStorage.setItem('apckarma-admin-logs', JSON.stringify(logsRes));
            } catch {
                /* ignore */
            }
            setEvents(eventsRes);
            setVolunteers(volsRes);
        } catch {
            /* network */
        } finally {
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
        if (res.ok) { showToast('Approved'); loadData(); }
        else showToast('Failed to approve', true);
    };

    const handleReject = async (logId) => {
        if (!approver) { showToast('Set approver name first', true); return; }
        const res = await fetch('/api/admin/reject', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logId, approver }),
        });
        if (res.ok) { showToast('Rejected'); loadData(); }
        else showToast('Failed to reject', true);
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!newEventName.trim()) return;
        const res = await fetch('/api/admin/create-event', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newEventName.trim() }),
        });
        if (res.ok) { showToast('Event created'); setNewEventName(''); loadData(); }
        else showToast('Failed to create event', true);
    };

    const handleRapidEntry = async (e) => {
        e.preventDefault();
        if (!rapidRoll || !rapidEvent || !rapidHours) return;
        const res = await fetch('/api/admin/manual-log', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roll: rapidRoll, company: rapidEvent, hours: parseFloat(rapidHours) }),
        });
        if (res.ok) { showToast('Log added'); setRapidRoll(''); setRapidEvent(''); setRapidHours(''); loadData(); }
        else showToast('Failed to add log', true);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetRoll || !resetPassword) return;
        const res = await fetch('/api/admin/reset-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roll: resetRoll, newPassword: resetPassword }),
        });
        if (res.ok) { showToast('Password reset'); setResetRoll(''); setResetPassword(''); }
        else showToast('Failed to reset password', true);
    };

    // Open events
    const now = new Date();
    const openEvents = events.filter(e => {
        const created = new Date(e.createdAt);
        return (now - created) / (1000 * 60 * 60 * 24) <= 3;
    });

    const logsByEvent = {};
    openEvents.forEach(e => {
        logsByEvent[e.name] = [];
    });
    logs.forEach(log => {
        const key = log.company || 'Unknown';
        if (!logsByEvent[key]) logsByEvent[key] = [];
        logsByEvent[key].push(log);
    });

    if (!isMounted) return null;
    if (loading) return <div className="empty-state" style={{ paddingTop: 80 }}><span className="font-mono text-muted">Loading...</span></div>;

    return (
        <>
            <ThemeToggle />
            <div className="app-container">
                <header className="app-header">
                    <div className="auth-logo-header">
                        <img src="/apckarma_white.png" alt="APC Karma" className="auth-logo-img" />
                        <div className="auth-logo-text">APC Karma</div>
                    </div>
                    <div className="auth-subline">
                        <span className="admin-text">Admin</span>
                        <span style={{ color: 'var(--border-light)' }}>|</span>
                        <button className="logout-btn" onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            router.push('/login');
                        }}>Logout</button>
                    </div>
                </header>

                <div className="page-content">
                    {/* Admin Dashboard Title + approver inline */}
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>Admin Dashboard</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Approving as{' '}
                            <input
                                type="text"
                                placeholder="change"
                                value={approver}
                                onChange={(e) => handleSetApprover(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--accent)',
                                    fontWeight: 700,
                                    outline: 'none',
                                    width: 120,
                                    fontSize: '0.8rem',
                                    padding: '0 2px',
                                }}
                            />
                        </div>
                    </div>

                    {/* Create New Event */}
                    <div className="card" style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10 }}>Create New Event</div>
                        <form onSubmit={handleCreateEvent} style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Event / Company name"
                                value={newEventName}
                                onChange={(e) => setNewEventName(e.target.value)}
                                style={{ flex: 1, padding: '10px 12px', fontSize: '0.85rem' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.85rem' }}>
                                CREATE
                            </button>
                        </form>
                    </div>

                    {/* Recent Events & Logs */}
                    <div className="card" style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10 }}>Recent Events &amp; Logs</div>
                        {Object.keys(logsByEvent).length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '8px 0' }}>No logs yet</div>
                        ) : (
                            Object.entries(logsByEvent).map(([eventName, eventLogs]) => {
                                const pendingCount = eventLogs.filter(l => l.status === 'pending').length;
                                const isExpanded = expandedEvents[eventName];
                                return (
                                    <div key={eventName} style={{ marginBottom: 8 }}>
                                        <div
                                            onClick={() => setExpandedEvents(prev => ({ ...prev, [eventName]: !prev[eventName] }))}
                                            style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '10px 12px', background: 'var(--bg-tertiary)',
                                                border: '1px solid var(--border)', cursor: 'pointer',
                                                fontSize: '0.85rem', fontWeight: 600,
                                            }}
                                        >
                                            <span>{eventName}</span>
                                            <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.75rem' }}>
                                                {pendingCount > 0 && <span className="badge badge-pending">{pendingCount} pending ▲</span>}
                                                <span className="text-muted">
                                                    {eventLogs.length > 0 ? `${eventLogs.length} logs ${isExpanded ? '▾' : '▸'}` : 'Open'}
                                                </span>
                                            </span>
                                        </div>
                                        {isExpanded && eventLogs.map(log => (
                                            <div key={log.id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '10px 12px', borderBottom: '1px solid var(--border)',
                                                background: 'var(--bg-card)',
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{log.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {log.roll} · {log.hours}h · {timeAgo(log.timestamp)}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    {log.status === 'pending' ? (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button onClick={() => handleApprove(log.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--accent)', border: 'none' }}>
                                                                ✔ APPROVE
                                                            </button>
                                                            <button onClick={() => handleReject(log.id)} className="btn" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                                                ✖ Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                                            <span className={`badge badge-${log.status}`}>
                                                                {log.status.toUpperCase()}
                                                            </span>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {log.verification}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Rapid Entry Log */}
                    <div className="card" style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10 }}>Rapid Entry Log</div>
                        <form onSubmit={handleRapidEntry} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <select className="form-input" value={rapidRoll} onChange={(e) => setRapidRoll(e.target.value)}>
                                <option value="">-- Select Volunteer --</option>
                                {volunteers.map(v => (
                                    <option key={v.roll} value={v.roll}>{v.name} ({v.roll})</option>
                                ))}
                            </select>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <select className="form-input" value={rapidEvent} onChange={(e) => setRapidEvent(e.target.value)} style={{ flex: 1 }}>
                                    <option value="">-- Event --</option>
                                    {openEvents.map((ev, i) => (
                                        <option key={i} value={ev.name}>{ev.name}</option>
                                    ))}
                                </select>
                                <input type="number" className="form-input" placeholder="Hours" value={rapidHours} onChange={(e) => setRapidHours(e.target.value)} style={{ width: 80 }} min="0.5" max="24" step="0.5" />
                                <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', fontSize: '0.85rem' }}>LOG</button>
                            </div>
                        </form>
                    </div>

                    {/* Password Reset */}
                    <div className="card" style={{ marginBottom: 30 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10 }}>Reset Student Password</div>
                        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <input type="text" className="form-input" placeholder="Roll Number" value={resetRoll} onChange={(e) => setResetRoll(e.target.value)} />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="text" className="form-input" placeholder="New Temporary Password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} style={{ flex: 1 }} />
                                <button type="submit" className="btn" style={{ padding: '0 20px', fontSize: '0.85rem', border: '1px solid var(--border)' }}>Reset</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <BottomNav />
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
                    background: toast.isError ? 'var(--danger)' : 'var(--bg-tertiary)',
                    border: toast.isError ? 'none' : '1px solid var(--border)',
                    padding: '10px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                    zIndex: 999
                }}>
                    {toast.message}
                </div>
            )}
        </>
    );
}
