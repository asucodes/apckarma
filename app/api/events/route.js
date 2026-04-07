import { NextResponse } from 'next/server';
import { getEvents, isEventOpen } from '@/lib/sheets';

export async function GET() {
    try {
        const events = await getEvents();
        const openEvents = events.filter(e => isEventOpen(e.createdAt));
        return NextResponse.json(openEvents);
    } catch (error) {
        console.error('Events error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
