import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { getLogs } from '@/lib/sheets';

export async function GET() {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        const logs = await getLogs();
        const pendingCount = logs.filter(l => l.status === 'pending').length;
        return NextResponse.json({ count: pendingCount });
    } catch (error) {
        console.error('Pending error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
