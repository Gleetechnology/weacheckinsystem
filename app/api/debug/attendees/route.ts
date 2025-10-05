import { NextRequest, NextResponse } from 'next/server';
import { createPrismaClient } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const prisma = createPrismaClient();
  try {
    // Get basic stats
    const totalAttendees = await prisma.attendee.count();
    const checkedInCount = await prisma.attendee.count({
      where: { checkedIn: true }
    });

    // Get recent check-ins
    const recentCheckins = await prisma.attendee.findMany({
      where: {
        checkedIn: true,
        checkedInAt: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        checkedIn: true,
        checkedInAt: true,
      },
      orderBy: {
        checkedInAt: 'desc'
      },
      take: 10
    });

    // Get recent registrations
    const recentRegistrations = await prisma.attendee.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get sample of attendees with check-in data
    const sampleAttendees = await prisma.attendee.findMany({
      select: {
        id: true,
        name: true,
        checkedIn: true,
        checkedInAt: true,
        createdAt: true,
      },
      take: 5
    });

    return NextResponse.json({
      debug: {
        totalAttendees,
        checkedInCount,
        recentCheckins: recentCheckins.map(c => ({
          id: c.id,
          name: c.name,
          checkedInAt: c.checkedInAt?.toISOString(),
          checkedIn: c.checkedIn
        })),
        recentRegistrations: recentRegistrations.map(r => ({
          id: r.id,
          name: r.name,
          createdAt: r.createdAt.toISOString()
        })),
        sampleAttendees: sampleAttendees.map(a => ({
          id: a.id,
          name: a.name,
          checkedIn: a.checkedIn,
          checkedInAt: a.checkedInAt?.toISOString(),
          createdAt: a.createdAt.toISOString()
        }))
      },
      success: true,
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}