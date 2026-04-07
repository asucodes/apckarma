'use client';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const saved = localStorage.getItem('apckarma-theme') || 'dark';
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
    }, []);

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('apckarma-theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    return (
        <button className="theme-toggle" onClick={toggle} title="Toggle theme">
            {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
    );
}
