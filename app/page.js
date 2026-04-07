'use client';
import { useState, useEffect } from 'react';
import AuthHeader from './components/AuthHeader';
import BottomNav from './components/BottomNav';
import ThemeToggle from './components/ThemeToggle';
import SplashScreen from './components/SplashScreen';
import { Clock, Eye } from 'lucide-react';

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

export default function LeaderboardPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('karma');
    const [expandedRow, setExpandedRow] = useState(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const cached = localStorage.getItem('apckarma-board');
        if (cached) setData(d => (JSON.parse(cached)));

        fetch('/api/leaderboard')
            .then(r => r.json())
            .then(d => {
                setData(d);
                localStorage.setItem('apckarma-board', JSON.stringify(d));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const sortedData = [...data].sort((a, b) => {
        switch (sortBy) {
            case 'karma': return b.karma - a.karma;
            case 'events': return b.eventCount - a.eventCount;
            case 'hours': return b.totalHours - a.totalHours;
            case 'upvotes': return b.totalUpvotes - a.totalUpvotes;
            default: return 0;
        }
    });

    const getRankIcon = (index) => {
        return index + 1; // TnP Karma uses yellow numbers for rank instead of medals
    };

    const getStatValue = (item) => {
        switch (sortBy) {
            case 'karma': return item.karma;
            case 'events': return item.eventCount;
            case 'hours': return item.totalHours;
            case 'upvotes': return item.totalUpvotes;
            default: return item.karma;
        }
    };

    function getStatLabel() {
        return sortBy === 'karma' ? 'PTS' : sortBy === 'events' ? 'EVENTS' : 'HOURS';
    }

    if (!isMounted) return null;

    return (
        <>
            <SplashScreen />
            <ThemeToggle />
            <div className="app-container">
                <AuthHeader />

                <div className="page-content">
                    {/* TnP Karma uses only tabs at the top of the board */}
                    <div className="tabs">
                        {['karma', 'events', 'hours'].map(tab => (
                            <button
                                key={tab}
                                className={`tab ${sortBy === tab ? 'active' : ''}`}
                                onClick={() => setSortBy(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="empty-state">
                            <span className="font-mono text-muted">Loading...</span>
                        </div>
                    ) : sortedData.length === 0 ? (
                        <div className="empty-state">
                            <p>No data available.</p>
                        </div>
                    ) : (
                        sortedData.map((item, index) => (
                            <div key={item.roll}>
                                <div
                                    className="leaderboard-row"
                                    onClick={() => setExpandedRow(expandedRow === item.roll ? null : item.roll)}
                                >
                                    <div className={`leaderboard-rank ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}`}>
                                        {index + 1}
                                    </div>
                                    <div className="leaderboard-info">
                                        <div className="leaderboard-name">{item.name}</div>
                                        <div className="leaderboard-roll">{item.roll}</div>
                                    </div>
                                    <div className="leaderboard-stat">
                                        <div className="stat-value">{getStatValue(item)}</div>
                                        <div className="stat-label">{getStatLabel()}</div>
                                    </div>
                                </div>
                                {expandedRow === item.roll && item.logs && (
                                    <div className="expanded-logs">
                                        {item.logs.map((log, i) => (
                                            <div key={i} className="expanded-log-item">
                                                <span>{log.company}</span>
                                                <span className="font-mono text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Clock size={12} /> {log.hours}h
                                                    <Eye size={12} style={{ marginLeft: 4 }} /> {log.upvotes || 0}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
            <BottomNav />
        </>
    );
}
