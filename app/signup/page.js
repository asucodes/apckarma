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
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/mascot.jpg" alt="APC Karma" />
                    <h1>APC Karma</h1>
                    <p>Create your account</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Select Your Name</label>
                        <select
                            id="signup-name"
                            className="form-select"
                            value={selected}
                            onChange={(e) => setSelected(e.target.value)}
                            required
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
                        <div className="form-group">
                            <label className="form-label">Roll Number</label>
                            <input
                                type="text"
                                className="form-input"
                                value={selectedVolunteer.roll}
                                disabled
                                style={{ opacity: 0.7 }}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Set Password</label>
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
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            id="signup-confirm"
                            type="password"
                            className="form-input"
                            placeholder="Repeat password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    {error && <div className="info-banner" style={{ borderColor: 'var(--danger)', background: 'rgba(220,38,38,0.08)' }}><strong style={{ color: 'var(--danger)' }}>Error:</strong> {error}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <a href="/login">Sign in</a>
                </div>
            </div>
        </div>
    );
}
