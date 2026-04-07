import { NextResponse } from 'next/server';
import { addLog } from '@/lib/sheets';
import { getSession } from '@/lib/auth';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { company, hours } = await request.json();
        if (!company || !hours) {
            return NextResponse.json({ error: 'Event and hours are required' }, { status: 400 });
        }
        if (hours < 0.5 || hours > 24) {
            return NextResponse.json({ error: 'Hours must be between 0.5 and 24' }, { status: 400 });
        }

        await addLog(session.name, session.roll, company, hours);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Log error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
