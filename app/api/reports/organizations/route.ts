import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get organization breakdown with proper null handling
    const organizationData = await prisma.attendee.groupBy({
      by: ['organization'],
      where: {
        organization: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Process and format the data, ensuring no null values
    const result = organizationData
      .filter((item: any) => item.organization && item.organization.trim() !== '')
      .map((item: any) => ({
        name: item.organization.trim(),
        count: item._count.id,
      }));

    // Add count for attendees without organization
    const noOrgCount = await prisma.attendee.count({
      where: {
        OR: [
          { organization: null },
          { organization: '' },
          { organization: undefined },
        ],
      },
    });

    if (noOrgCount > 0) {
      result.push({
        name: 'No Organization',
        count: noOrgCount,
      });
    }

    // Sort by count descending
    result.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      data: result,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching organizations data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations data' },
      { status: 500 }
    );
  }
}