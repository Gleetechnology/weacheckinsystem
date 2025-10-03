import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const attendees = await prisma.attendee.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendees');

    // Add headers
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Checked In At', key: 'checkedInAt', width: 20 },
      { header: 'QR Code', key: 'qrCode', width: 20 },
    ];

    // Add data rows
    attendees.forEach((attendee, index) => {
      const row = worksheet.addRow({
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone || '',
        status: attendee.checkedIn ? 'Checked In' : 'Pending',
        checkedInAt: attendee.checkedInAt || '',
        qrCode: '', // Placeholder for image
      });

      // Add QR code image if available
      if (attendee.qrCode) {
        // Convert data URL to buffer
        const base64Data = attendee.qrCode.split(',')[1];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imageBuffer = Buffer.from(base64Data, 'base64') as any;

        // Add image to workbook
        const imageId = workbook.addImage({
          buffer: imageBuffer,
          extension: 'png',
        });

        // Add image to cell (column F is QR Code column, 0-indexed as 5)
        worksheet.addImage(imageId, {
          tl: { col: 5, row: index + 1 }, // +1 because row 0 is header
          ext: { width: 100, height: 100 },
        });
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="attendees_with_qr.xlsx"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 });
  }
}