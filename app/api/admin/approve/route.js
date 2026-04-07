import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { updateLogStatus } from '@/lib/sheets';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        const { logId, approver } = await request.json();
        if (!logId) {
            return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
        }
        await updateLogStatus(logId, 'approved', approver || session.name);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Approve error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
