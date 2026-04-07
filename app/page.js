'use client';
import { useState, useEffect } from 'react';
import AuthHeader from './components/AuthHeader';
import BottomNav from './components/BottomNav';
import ThemeToggle from './components/ThemeToggle';
import SplashScreen from './components/SplashScreen';

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

    useEffect(() => {
        fetch('/api/leaderboard')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
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
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
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

    const getStatLabel = () => {
        switch (sortBy) {
            case 'karma': return 'karma';
            case 'events': return 'events';
            case 'hours': return 'hours';
            case 'upvotes': return 'upvotes';
            default: return 'karma';
        }
    };

    return (
        <>
            <SplashScreen />
            <ThemeToggle />
            <div className="app-container">
                <AuthHeader />
                <h1 className="page-title">🏆 Leaderboard</h1>

                <div className="tabs">
                    {['karma', 'events', 'hours', 'upvotes'].map(tab => (
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
                    <div className="loading">Loading</div>
                ) : sortedData.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📊</div>
                        <p>No approved logs yet. Start logging hours!</p>
                    </div>
                ) : (
                    sortedData.map((item, index) => (
                        <div key={item.roll}>
                            <div
                                className="leaderboard-row"
                                onClick={() => setExpandedRow(expandedRow === item.roll ? null : item.roll)}
                            >
                                <div className={`leaderboard-rank ${index < 3 ? `rank-${index + 1}` : ''}`}>
                                    {getRankIcon(index)}
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
                                            <span className="font-mono text-muted">{log.hours}h · {timeAgo(log.timestamp)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            <BottomNav />
        </>
    );
}
