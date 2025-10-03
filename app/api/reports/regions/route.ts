import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get region breakdown with proper null handling
    const regionData = await prisma.attendee.groupBy({
      by: ['regionOfWork'],
      where: {
        regionOfWork: {
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
    const result = regionData
      .filter((item: any) => item.regionOfWork && item.regionOfWork.trim() !== '')
      .map((item: any) => ({
        name: item.regionOfWork.trim(),
        count: item._count.id,
      }));

    // Add count for attendees without region
    const noRegionCount = await prisma.attendee.count({
      where: {
        OR: [
          { regionOfWork: null },
          { regionOfWork: '' },
          { regionOfWork: undefined },
        ],
      },
    });

    if (noRegionCount > 0) {
      result.push({
        name: 'No Region Specified',
        count: noRegionCount,
      });
    }

    // Sort by count descending
    result.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      data: result,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching regions data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regions data' },
      { status: 500 }
    );
  }
}