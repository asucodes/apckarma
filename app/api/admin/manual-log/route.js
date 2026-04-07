import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { addLog, VOLUNTEERS } from '@/lib/sheets';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { roll, company, hours } = await request.json();
        if (!roll || !company || !hours) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const volunteer = VOLUNTEERS.find(v => v.roll.toLowerCase() === roll.toLowerCase());
        if (!volunteer) {
            return NextResponse.json({ error: 'Volunteer not found in roster' }, { status: 404 });
        }

        await addLog(volunteer.name, volunteer.roll, company, hours, 'approved', session.name || 'Admin Rapid');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Manual log error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
