import { NextResponse } from 'next/server';
import { getSession, isAdmin, hashPassword } from '@/lib/auth';
import { updateUserPassword } from '@/lib/sheets';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        const { roll, newPassword } = await request.json();
        if (!roll || !newPassword) {
            return NextResponse.json({ error: 'Roll number and new password are required' }, { status: 400 });
        }
        const hash = await hashPassword(newPassword);
        await updateUserPassword(roll, hash);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
