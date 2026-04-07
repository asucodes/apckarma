'use client';
import { useState, useEffect } from 'react';
import AuthHeader from '../components/AuthHeader';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';
import { ArrowUp, ArrowDown, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
        // Load vote state from localStorage
        const saved = localStorage.getItem('apckarma-votes');
        if (saved) setVotedLogs(JSON.parse(saved));
        fetch('/api/logs')
            .then(r => r.json())
            .then(data => {
                const approved = data.filter(l => l.status === 'approved');
                setLogs(approved);
                localStorage.setItem('apckarma-feed', JSON.stringify(approved));
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
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Vote failed');
            }
        } catch {
            alert('Vote failed. Internet issue?');
        }
    };

    if (!isMounted) return null;

    return (
        <>
            <ThemeToggle />
            <div className="app-container">
                <AuthHeader />

                <div className="page-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Feed</span>
                        <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <RefreshCcw size={12} /> Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="empty-state">
                            <span className="font-mono text-muted">Loading...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="empty-state">
                            <p>No activity yet.</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className={`feed-card ${log.disputed ? 'feed-card-disputed' : ''}`}>
                                <div className="feed-votes">
                                    <button
                                        className={`vote-btn upvote ${votedLogs[`${log.id}-up`] ? 'voted' : ''}`}
                                        onClick={() => handleVote(log.id, 'up')}
                                        disabled={votedLogs[`${log.id}-up`]}
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <span className="vote-count">{log.upvotes - log.downvotes}</span>
                                    <button
                                        className={`vote-btn downvote ${votedLogs[`${log.id}-down`] ? 'voted' : ''}`}
                                        onClick={() => handleVote(log.id, 'down')}
                                        disabled={votedLogs[`${log.id}-down`]}
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                </div>
                                <div className="feed-content">
                                    <div className="feed-header">
                                        <span className="feed-name">{log.name}</span>
                                        <span style={{ color: 'var(--text-muted)' }}> • Logged {log.hours} hours • {timeAgo(log.timestamp)}</span>
                                        {log.disputed && <span className="disputed-tag" style={{ marginLeft: 6 }}>Disputed</span>}
                                    </div>
                                    <div className="feed-company">{log.company}</div>
                                    <div className="karma-tag">+{Math.round(log.hours * 10)} karma</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <BottomNav />
        </>
    );
}
