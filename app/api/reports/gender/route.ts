import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../../lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) {
      return NextResponse.json({ error: 'Authorization header is missing' }, { status: 401 });
    }

    const token = authorization.split(' ')[1];
    if (!verifyToken(token)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const genderDistribution = await prisma.attendee.groupBy({
      by: ['gender'],
      _count: {
        gender: true,
      },
    });

    const totalAttendees = await prisma.attendee.count();

    const formattedData = genderDistribution.map((item: { gender: string | null; _count: { gender: number } }) => ({
      gender: item.gender,
      count: item._count.gender,
      total: totalAttendees,
    }));

    return NextResponse.json({
      message: 'Gender distribution fetched successfully',
      data: formattedData,
    });
  } catch (error) {
    console.error('Error fetching gender distribution:', error);
    return NextResponse.json({ error: 'Failed to fetch gender distribution' }, { status: 500 });
  }
}