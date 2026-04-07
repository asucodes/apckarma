'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Don't show on auth pages
    const hiddenPaths = ['/login', '/signup'];
    if (hiddenPaths.includes(pathname)) return null;

    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.role === 'admin') {
                    setIsAdmin(true);
                    fetch('/api/admin/pending')
                        .then(r => r.ok ? r.json() : null)
                        .then(d => { if (d) setPendingCount(d.count); });
                }
            })
            .catch(() => { });
    }, [pathname]);

    const tabs = [
        { path: '/', icon: '🏆', label: 'Board' },
        { path: '/log', icon: '📝', label: 'Log' },
        { path: '/feed', icon: '📰', label: 'Feed' },
        { path: '/profile', icon: '👤', label: 'My Logs' },
    ];

    if (isAdmin) {
        tabs.push({ path: '/admin', icon: '⚙️', label: 'Admin' });
    }

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-inner">
                {tabs.map(tab => (
                    <button
                        key={tab.path}
                        className={`nav-item ${pathname === tab.path ? 'active' : ''}`}
                        onClick={() => router.push(tab.path)}
                    >
                        <span className="nav-icon">{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.path === '/admin' && pendingCount > 0 && (
                            <span className="nav-badge">{pendingCount}</span>
                        )}
                    </button>
                ))}
            </div>
        </nav>
    );
}
