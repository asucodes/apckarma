'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthHeader from '../components/AuthHeader';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';

export default function LogPage() {
    const [events, setEvents] = useState(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('apckarma-events');
            if (cached) return JSON.parse(cached);
        }
        return [];
    });
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
                setEvents(data);
                localStorage.setItem('apckarma-events', JSON.stringify(data));
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
                showToast('Hours logged! Pending admin approval.');
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

                <div className="page-content">
                    <div className="form-container">
                        <div className="form-container-header">LOG ACTIVITY</div>

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
                                    <option value="">Select event...</option>
                                    {events.map((ev, i) => (
                                        <option key={i} value={ev.name}>{ev.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '32px' }}>
                                <label className="form-label">Hours Contributed</label>
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

                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '16px', width: '100%', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                {loading ? 'Submitting...' : 'LOG IT'}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                +10 karma per hour &bull; +50 karma per unique event
                            </div>
                        </form>
                    </div>

                    {events.length === 0 && (
                        <div className="empty-state mt-16">
                            <p>No open events right now.</p>
                        </div>
                    )}

                    <hr style={{ border: 'none', borderBottom: '1px solid var(--border)', margin: '32px 0 24px' }} />
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', paddingBottom: '32px' }}>
                        <p style={{ fontWeight: 700, margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Managed by Ashirvad</p>
                        <p style={{ fontSize: '0.8rem', marginBottom: '16px' }}>For any discrepancies, pls connect</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                            <a href="https://wa.me/91895708438" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.662-2.062-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                                </svg>
                            </a>
                            <a href="https://discord.com/users/1248097789368467533" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <BottomNav />
            {toast && <div className={`toast ${toast.isError ? 'error' : ''}`}>{toast.message}</div>}
        </>
    );
}
