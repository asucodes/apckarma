'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [roll, setRoll] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roll, password, rememberMe: remember }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Login failed');
                return;
            }
            router.push(data.role === 'admin' ? '/admin' : '/');
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
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>Work Hour Tracker</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Roll Number</label>
                            <input
                                id="login-roll"
                                type="text"
                                className="form-input"
                                placeholder="e.g. 2024UCS1501"
                                value={roll}
                                onChange={(e) => setRoll(e.target.value)}
                                required
                                autoComplete="username"
                                style={{ width: '100%', padding: '10px 12px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Password</label>
                            <input
                                id="login-password"
                                type="password"
                                className="form-input"
                                placeholder="Your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                style={{ width: '100%', padding: '10px 12px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                            <input
                                id="remember-me"
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                style={{ accentColor: 'var(--accent)' }}
                            />
                            <label htmlFor="remember-me" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Remember me for 30 days</label>
                        </div>

                        {error && <div style={{ border: '1px solid var(--danger)', background: 'rgba(239, 68, 68, 0.08)', padding: '10px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-primary)' }}><strong style={{ color: 'var(--danger)' }}>Error:</strong> {error}</div>}

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px' }}>
                            {loading ? 'WAIT...' : 'SIGN IN'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Don't have an account? <a href="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign up</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
