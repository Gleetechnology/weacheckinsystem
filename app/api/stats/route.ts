import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const [total, checkedIn] = await Promise.all([
      prisma.attendee.count(),
      prisma.attendee.count({ where: { checkedIn: true } }),
    ]);
    const pending = total - checkedIn;

    return NextResponse.json({ total, checkedIn, pending });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}