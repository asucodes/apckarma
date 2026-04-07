import { NextResponse } from 'next/server';
import { VOLUNTEERS } from '@/lib/sheets';

export async function GET() {
    return NextResponse.json(VOLUNTEERS);
}
