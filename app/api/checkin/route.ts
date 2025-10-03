import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyAttendeeCheckin } from '../../../lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const { qrData } = await request.json();

    if (!qrData) {
      return NextResponse.json({ error: 'QR data is required' }, { status: 400 });
    }

    // Find attendee by QR code data
    const attendee = await prisma.attendee.findFirst({ where: { qrData } });

    if (!attendee) {
      return NextResponse.json({ error: 'Data is not available for check-in' }, { status: 404 });
    }

    if (attendee.checkedIn) {
      return NextResponse.json({ message: 'Already checked in', attendee });
    }

    const updatedAttendee = await prisma.attendee.update({
      where: { id: attendee.id },
      data: { checkedIn: true, checkedInAt: new Date() },
    });

    // Create notification for successful check-in
    await notifyAttendeeCheckin(attendee.name, attendee.id);

    return NextResponse.json({ message: 'Checked in successfully', attendee: updatedAttendee });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}