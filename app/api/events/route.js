import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/sheets';

export async function GET() {
    try {
        const events = await getEvents();
        return NextResponse.json(events);
    } catch (error) {
        console.error('Events error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
