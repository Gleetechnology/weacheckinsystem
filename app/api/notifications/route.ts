import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - Fetch notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';

    const whereClause: any = {};
    if (unreadOnly) {
      whereClause.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { read: false },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type = 'info', attendeeId, adminId } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        attendeeId,
        adminId,
      },
    });

    return NextResponse.json({
      notification,
      success: true,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}