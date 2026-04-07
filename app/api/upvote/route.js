import { NextResponse } from 'next/server';
import { getLogs, updateLogVotes } from '@/lib/sheets';
import { getSession } from '@/lib/auth';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

        const { logId } = await request.json();
        if (!logId) {
            return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
        }

        const logs = await getLogs();
        const log = logs.find(l => l.id === logId);
        if (!log) {
            return NextResponse.json({ error: 'Log not found' }, { status: 404 });
        }

        // Feature Parity: Verify attendance before allowing witness upvote
        const upvoterRoll = session.roll;
        const hasAttended = logs.some(l =>
            l.roll === upvoterRoll &&
            l.company.trim().toLowerCase() === log.company.trim().toLowerCase() &&
            l.status === 'approved'
        );

        if (!hasAttended) {
            return NextResponse.json({ error: `Must attend and be approved for ${log.company} to upvote others.` }, { status: 403 });
        }

        await updateLogVotes(logId, log.upvotes + 1, log.downvotes);
        return NextResponse.json({ success: true, upvotes: log.upvotes + 1 });
    } catch (error) {
        console.error('Upvote error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
