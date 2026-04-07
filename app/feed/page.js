'use client';
import { useState, useEffect } from 'react';
import AuthHeader from '../components/AuthHeader';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';

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

export default function FeedPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [votedLogs, setVotedLogs] = useState({});

    useEffect(() => {
        // Load vote state from localStorage
        const saved = localStorage.getItem('apckarma-votes');
        if (saved) setVotedLogs(JSON.parse(saved));

        fetch('/api/logs')
            .then(r => r.json())
            .then(data => {
                setLogs(data.filter(l => l.status === 'approved'));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleVote = async (logId, type) => {
        const voteKey = `${logId}-${type}`;
        if (votedLogs[voteKey]) return; // Already voted

        const endpoint = type === 'up' ? '/api/upvote' : '/api/downvote';
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logId }),
            });
            if (res.ok) {
                const newVoted = { ...votedLogs, [voteKey]: true };
                setVotedLogs(newVoted);
                localStorage.setItem('apckarma-votes', JSON.stringify(newVoted));

                // Update local state
                setLogs(prev => prev.map(l => {
                    if (l.id === logId) {
                        return {
                            ...l,
                            upvotes: type === 'up' ? l.upvotes + 1 : l.upvotes,
                            downvotes: type === 'down' ? l.downvotes + 1 : l.downvotes,
                        };
                    }
                    return l;
                }));
            }
        } catch {
            console.error('Vote failed');
        }
    };

    return (
        <>
            <ThemeToggle />
            <div className="app-container">
                <AuthHeader />
                <h1 className="page-title">📰 Feed</h1>
                <p className="page-subtitle">Approved activity — upvote or downvote</p>

                {loading ? (
                    <div className="loading">Loading</div>
                ) : logs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📰</div>
                        <p>No approved logs yet</p>
                    </div>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="feed-card">
                            <div className="feed-votes">
                                <button
                                    className={`vote-btn upvote ${votedLogs[`${log.id}-up`] ? 'voted' : ''}`}
                                    onClick={() => handleVote(log.id, 'up')}
                                    disabled={votedLogs[`${log.id}-up`]}
                                    title="Upvote"
                                >
                                    ▲
                                </button>
                                <span className="vote-count">{log.upvotes - log.downvotes}</span>
                                <button
                                    className={`vote-btn downvote ${votedLogs[`${log.id}-down`] ? 'voted' : ''}`}
                                    onClick={() => handleVote(log.id, 'down')}
                                    disabled={votedLogs[`${log.id}-down`]}
                                    title="Downvote"
                                >
                                    ▼
                                </button>
                            </div>
                            <div className="feed-content">
                                <div className="feed-header">
                                    <span className="feed-name">{log.name}</span>
                                    <span className="feed-time">{timeAgo(log.timestamp)}</span>
                                </div>
                                <div className="feed-company">{log.company}</div>
                                <div className="feed-hours">{log.hours} hours · {log.roll}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <BottomNav />
        </>
    );
}
