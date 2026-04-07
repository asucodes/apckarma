'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [volunteers, setVolunteers] = useState([]);
    const [selected, setSelected] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/volunteers')
            .then(r => r.json())
            .then(data => setVolunteers(data))
            .catch(() => { });
    }, []);

    const selectedVolunteer = volunteers.find(v => v.roll === selected);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!selected) { setError('Please select your name'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roll: selectedVolunteer.roll,
                    name: selectedVolunteer.name,
                    password,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Signup failed');
                return;
            }
            router.push('/login');
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="page-content" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
                <div className="card" style={{ padding: '32px 24px', margin: 0 }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <img src="/apckarma.jpg" alt="APC Karma" className="logo-light" style={{ width: 104, height: 104, objectFit: 'contain', margin: '0 auto', borderRadius: '8px' }} />
                        <img src="/apckarma_white.png" alt="APC Karma" className="logo-dark" style={{ width: 104, height: 104, objectFit: 'contain', margin: '0 auto', filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.2))' }} />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '16px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>APC Karma</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>Create your account</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Select Your Name</label>
                            <select
                                id="signup-name"
                                className="form-select"
                                value={selected}
                                onChange={(e) => setSelected(e.target.value)}
                                required
                                style={{ width: '100%', padding: '10px 12px' }}
                            >
                                <option value="">-- Select your name --</option>
                                {volunteers.map(v => (
                                    <option key={v.roll} value={v.roll}>
                                        {v.name} ({v.roll})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedVolunteer && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Roll Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={selectedVolunteer.roll}
                                    disabled
                                    style={{ width: '100%', padding: '10px 12px', opacity: 0.7 }}
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Set Password</label>
                            <input
                                id="signup-password"
                                type="password"
                                className="form-input"
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                autoComplete="new-password"
                                style={{ width: '100%', padding: '10px 12px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Confirm Password</label>
                            <input
                                id="signup-confirm"
                                type="password"
                                className="form-input"
                                placeholder="Repeat password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                style={{ width: '100%', padding: '10px 12px' }}
                            />
                        </div>

                        {error && <div style={{ border: '1px solid var(--danger)', background: 'rgba(239, 68, 68, 0.08)', padding: '10px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-primary)' }}><strong style={{ color: 'var(--danger)' }}>Error:</strong> {error}</div>}

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px' }}>
                            {loading ? 'WAIT...' : 'CREATE ACCOUNT'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Already have an account? <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
