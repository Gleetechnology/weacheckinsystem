import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};

    // Add status filter
    if (status === 'checked-in') {
      where.checkedIn = true;
    } else if (status === 'pending') {
      where.checkedIn = false;
    }

    // Add search conditions
    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { organization: { contains: searchTerm } },
      ];
    }

    const [attendees, total] = await Promise.all([
      prisma.attendee.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attendee.count({ where }),
    ]);

    // Get column names from the first attendee (assuming all have same column names)
    const firstAttendee = attendees.length > 0 ? attendees[0] : null;
    const columns = firstAttendee ? {
      name: firstAttendee.nameCol || 'Name',
      email: firstAttendee.emailCol || 'Email',
      phone: firstAttendee.phoneCol || 'Phone',
    } : {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
    };

    // Parse extraData for each attendee
    const attendeesWithExtra = attendees.map((attendee: any) => ({
      ...attendee,
      extraData: attendee.extraData ? JSON.parse(attendee.extraData) : {},
    }));

    return NextResponse.json({
      attendees: attendeesWithExtra,
      columns,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}