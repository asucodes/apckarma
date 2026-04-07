import { NextResponse } from 'next/server';
import { getLogs } from '@/lib/sheets';

export async function GET() {
    try {
        const logs = await getLogs();
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
