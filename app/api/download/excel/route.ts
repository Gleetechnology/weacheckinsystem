import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const attendees = await prisma.attendee.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendees');

    // Add headers
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'ID', key: 'attendeeId', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: '열2', key: 'column2', width: 15 },
      { header: 'Organization', key: 'organization', width: 25 },
      { header: 'Position in Organization', key: 'positionInOrganization', width: 25 },
      { header: 'Preferred Title', key: 'preferredTitle', width: 20 },
      { header: 'Region of Work', key: 'regionOfWork', width: 20 },
      { header: '번호', key: 'phoneKorean', width: 15 },
      { header: '한글', key: 'koreanText', width: 20 },
      { header: '직분', key: 'positionKorean', width: 20 },
      { header: '영어', key: 'englishText', width: 20 },
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
        attendeeId: attendee.attendeeId || '',
        fullName: attendee.fullName || '',
        column2: attendee.column2 || '',
        organization: attendee.organization || '',
        preferredTitle: attendee.preferredTitle || '',
        positionInOrganization: attendee.positionInOrganization || '',
        regionOfWork: attendee.regionOfWork || '',
        phoneKorean: attendee.phoneKorean || '',
        koreanText: attendee.koreanText || '',
        positionKorean: attendee.positionKorean || '',
        englishText: attendee.englishText || '',
        status: attendee.checkedIn ? 'Checked In' : 'Pending',
        checkedInAt: attendee.checkedInAt || '',
        qrCode: '', // Placeholder for image
      });

      // Add QR code image if available
      if (attendee.qrCode && attendee.qrCode.startsWith('data:image')) {
        try {
          // Convert data URL to buffer
          const base64Data = attendee.qrCode.split(',')[1];
          if (base64Data) {
            const imageBuffer = Buffer.from(base64Data, 'base64') as any;

            // Add image to workbook
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: 'png',
            });

            // Add image to cell (column R is QR Code column, 0-indexed as 16)
            worksheet.addImage(imageId, {
              tl: { col: 16, row: index + 1 }, // +1 because row 0 is header
              ext: { width: 100, height: 100 },
            });
          }
        } catch (imageError) {
          console.error(`Failed to process QR code for attendee ${attendee.name}:`, imageError);
          // Continue without adding the image
        }
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Ensure buffer is properly typed
    const arrayBuffer = buffer as ArrayBuffer;

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="attendees_with_qr.xlsx"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 });
  }
}