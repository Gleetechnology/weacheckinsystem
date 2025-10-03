import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get position breakdown from multiple position fields
    const positionData = await prisma.attendee.groupBy({
      by: ['positionInOrganization'],
      where: {
        positionInOrganization: {
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

    // Also get Korean positions
    const koreanPositionData = await prisma.attendee.groupBy({
      by: ['positionKorean'],
      where: {
        positionKorean: {
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

    // Also get English positions
    const englishPositionData = await prisma.attendee.groupBy({
      by: ['positionEnglish'],
      where: {
        positionEnglish: {
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

    // Combine all position data
    const positionMap = new Map();

    // Process organization positions
    positionData.forEach((item: any) => {
      if (item.positionInOrganization && item.positionInOrganization.trim() !== '') {
        const key = `Organization: ${item.positionInOrganization.trim()}`;
        positionMap.set(key, (positionMap.get(key) || 0) + item._count.id);
      }
    });

    // Process Korean positions
    koreanPositionData.forEach((item: any) => {
      if (item.positionKorean && item.positionKorean.trim() !== '') {
        const key = `Korean: ${item.positionKorean.trim()}`;
        positionMap.set(key, (positionMap.get(key) || 0) + item._count.id);
      }
    });

    // Process English positions
    englishPositionData.forEach((item: any) => {
      if (item.positionEnglish && item.positionEnglish.trim() !== '') {
        const key = `English: ${item.positionEnglish.trim()}`;
        positionMap.set(key, (positionMap.get(key) || 0) + item._count.id);
      }
    });

    // Convert to array and sort by count
    const result = Array.from(positionMap.entries()).map(([name, count]) => ({
      name,
      count,
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      data: result,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching positions data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions data' },
      { status: 500 }
    );
  }
}