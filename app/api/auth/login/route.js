import { NextResponse } from 'next/server';
import { getUser } from '@/lib/sheets';
import { comparePassword, signToken, setSessionCookie } from '@/lib/auth';

export async function POST(request) {
    try {
        const { roll, password, rememberMe } = await request.json();
        if (!roll || !password) {
            return NextResponse.json({ error: 'Roll number and password are required' }, { status: 400 });
        }

        // Admin login
        if (roll.toLowerCase() === process.env.ADMIN_ID?.toLowerCase()) {
            if (password === process.env.ADMIN_PASSWORD) {
                const token = signToken({ roll, name: 'Admin', role: 'admin' }, rememberMe ? '30d' : '1d');
                await setSessionCookie(token, rememberMe ? 30 * 86400 : 86400);
                return NextResponse.json({ success: true, role: 'admin' });
            }
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        // Regular user login
        const user = await getUser(roll);
        if (!user) {
            return NextResponse.json({ error: 'Account not found. Please sign up first.' }, { status: 404 });
        }

        const valid = await comparePassword(password, user.passwordHash);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const token = signToken(
            { roll: user.roll, name: user.name, role: user.role },
            rememberMe ? '30d' : '1d'
        );
        await setSessionCookie(token, rememberMe ? 30 * 86400 : 86400);
        return NextResponse.json({ success: true, role: user.role });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
