'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthHeader() {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data && !data.error) setUser(data);
                else router.push('/login');
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (!user) return null;

    return (
        <header className="app-header">
            <div className="user-info">
                <span className="user-roll">{user.roll}</span>
                <span>· {user.name}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </header>
    );
}
