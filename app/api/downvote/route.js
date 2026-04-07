import { NextResponse } from 'next/server';
import { getLogs, updateLogVotes } from '@/lib/sheets';

export async function POST(request) {
    try {
        const { logId } = await request.json();
        if (!logId) {
            return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
        }

        const logs = await getLogs();
        const log = logs.find(l => l.id === logId);
        if (!log) {
            return NextResponse.json({ error: 'Log not found' }, { status: 404 });
        }

        await updateLogVotes(logId, log.upvotes, log.downvotes + 1);
        return NextResponse.json({ success: true, downvotes: log.downvotes + 1 });
    } catch (error) {
        console.error('Downvote error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
