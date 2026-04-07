import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { createEvent } from '@/lib/sheets';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
        }
        await createEvent(name, session.name);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Create event error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
