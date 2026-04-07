'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LayoutGrid, PenSquare, Radio, User, Settings } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();
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
        { path: '/', icon: <LayoutGrid size={22} />, label: 'Board' },
        { path: '/log', icon: <PenSquare size={22} />, label: 'Log' },
        { path: '/feed', icon: <Radio size={22} />, label: 'Feed' },
        { path: '/profile', icon: <User size={22} />, label: 'My Logs' },
    ];

    if (isAdmin) {
        tabs.push({ path: '/admin', icon: <Settings size={22} />, label: 'Admin' });
    }

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-inner">
                {tabs.map(tab => (
                    <Link
                        key={tab.path}
                        href={tab.path}
                        className={`nav-item ${pathname === tab.path ? 'active' : ''}`}
                        prefetch={true}
                    >
                        <span className="nav-icon">{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.path === '/admin' && pendingCount > 0 && (
                            <span className="nav-badge">{pendingCount}</span>
                        )}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
