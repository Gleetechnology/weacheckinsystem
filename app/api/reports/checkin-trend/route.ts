import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Use specific event dates: Oct 27-31, 2025
    const eventStartDate = new Date('2025-10-27T00:00:00.000Z');
    const eventEndDate = new Date('2025-10-31T23:59:59.999Z');

    const startDate = eventStartDate;
    const endDate = eventEndDate;
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to include end date

    // Get check-in data grouped by date
    const checkinData = await prisma.attendee.findMany({
      where: {
        checkedIn: true,
        checkedInAt: {
          gte: startDate,
          lte: endDate,
          not: null,
        },
      },
      select: {
        checkedInAt: true,
        id: true,
      },
      orderBy: {
        checkedInAt: 'asc',
      },
    });

    console.log(`Found ${checkinData.length} check-ins in date range:`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sampleCheckins: checkinData.slice(0, 3).map(c => ({
        id: c.id,
        checkedInAt: c.checkedInAt?.toISOString()
      }))
    });

    // Process data to count check-ins per day
    const dateMap = new Map();
    checkinData.forEach((item: any) => {
      if (item.checkedInAt) {
        const dateKey = item.checkedInAt.toISOString().split('T')[0];
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }
    });

    // Generate array for all dates in range
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];

      result.push({
        date: dateKey,
        count: dateMap.get(dateKey) || 0,
      });
    }

    return NextResponse.json({
      data: result,
      success: true,
      totalCheckins: checkinData.length,
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
    });
  } catch (error) {
    console.error('Error fetching checkin trend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checkin trend' },
      { status: 500 }
    );
  }
}