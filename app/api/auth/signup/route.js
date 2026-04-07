import { NextResponse } from 'next/server';
import { getUser, createUser, VOLUNTEERS } from '@/lib/sheets';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
    try {
        const { roll, name, password } = await request.json();
        if (!roll || !name || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Check if in APC roster
        const volunteer = VOLUNTEERS.find(v => v.roll.toLowerCase() === roll.toLowerCase());
        if (!volunteer) {
            return NextResponse.json({ error: 'Roll number not in APC roster' }, { status: 403 });
        }

        // Check if already registered
        const existing = await getUser(roll);
        if (existing) {
            return NextResponse.json({ error: 'Account already exists. Please sign in.' }, { status: 409 });
        }

        const passwordHash = await hashPassword(password);
        await createUser(roll, name, passwordHash, 'user');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
