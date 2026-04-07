'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthHeader from '../components/AuthHeader';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';

export default function LogPage() {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [hours, setHours] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // Check auth
        fetch('/api/auth/me')
            .then(r => { if (!r.ok) router.push('/login'); })
            .catch(() => router.push('/login'));

        // Load events
        fetch('/api/events')
            .then(r => r.json())
            .then(data => {
                // Filter to open events (created within last 3 days)
                const now = new Date();
                const open = data.filter(e => {
                    const created = new Date(e.createdAt);
                    return (now - created) / (1000 * 60 * 60 * 24) <= 3;
                });
                setEvents(open);
            })
            .catch(() => { });
    }, [router]);

    const showToast = (message, isError = false) => {
        setToast({ message, isError });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEvent || !hours) return;

        setLoading(true);
        try {
            const res = await fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company: selectedEvent, hours: parseFloat(hours) }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast('✅ Hours logged! Pending admin approval.');
                setSelectedEvent('');
                setHours('');
            } else {
                showToast(data.error || 'Failed to log hours', true);
            }
        } catch {
            showToast('Network error', true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ThemeToggle />
            <div className="app-container">
                <AuthHeader />
                <h1 className="page-title">📝 Log Hours</h1>

                <div className="info-banner">
                    <strong>How it works:</strong> Select an open event, enter your hours, and submit. Your log
                    will be <strong>pending</strong> until an admin approves it.
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Event / Company</label>
                        <select
                            id="log-event"
                            className="form-select"
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                            required
                        >
                            <option value="">-- Select event --</option>
                            {events.map((ev, i) => (
                                <option key={i} value={ev.name}>{ev.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Hours Worked</label>
                        <input
                            id="log-hours"
                            type="number"
                            className="form-input"
                            placeholder="e.g. 2.5"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            min="0.5"
                            max="24"
                            step="0.5"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Log'}
                    </button>
                </form>

                {events.length === 0 && (
                    <div className="empty-state mt-16">
                        <div className="empty-icon">📅</div>
                        <p>No open events right now. Ask an admin to create one.</p>
                    </div>
                )}
            </div>
            <BottomNav />
            {toast && <div className={`toast ${toast.isError ? 'error' : ''}`}>{toast.message}</div>}
        </>
    );
}
