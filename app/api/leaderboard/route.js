import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/sheets';

export async function GET() {
    try {
        const data = await getLeaderboardData();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Leaderboard error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
