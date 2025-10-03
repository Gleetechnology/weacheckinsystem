import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Parse Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get headers from first row
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (rawData.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    const headers = rawData[0] as string[];
    console.log('Detected headers:', headers);

    const data = XLSX.utils.sheet_to_json(worksheet);

    // Detect column indices
    const findColumn = (keywords: string[]) => {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i]?.toString().toLowerCase().trim();
        if (keywords.some(keyword => header.includes(keyword))) {
          return i;
        }
      }
      return -1;
    };

    const nameCol = findColumn(['name', 'full name', 'first name', 'last name', 'attendee name', 'full name', '이름', '성명']);
    const emailCol = findColumn(['email', 'e-mail', 'mail', 'email address', '영어', '이메일']);
    const phoneCol = findColumn(['phone', 'mobile', 'contact', 'tel', 'phone number', '번호', '전화', '휴대폰']);

    console.log('Headers:', headers);
    console.log('Detected columns - Name:', nameCol, 'Email:', emailCol, 'Phone:', phoneCol);
    console.log('Data rows:', data.length);

    if (data.length === 0) {
      return NextResponse.json({ error: 'No data rows found in the Excel file' }, { status: 400 });
    }

    if (nameCol === -1 || emailCol === -1) {
      return NextResponse.json({
        error: 'Required columns not found. Please ensure your Excel file has columns for Name and Email.'
      }, { status: 400 });
    }

    const attendees = [];

    for (const row of data) {
      const rowData = row as Record<string, unknown>;
      const name = rowData[headers[nameCol]]?.toString().trim();
      const email = rowData[headers[emailCol]]?.toString().trim();
      const phone = phoneCol !== -1 ? rowData[headers[phoneCol]]?.toString().trim() : undefined;

      console.log('Processing row:', { name, email, phone });

      if (!name || !email) {
        console.log('Skipping row - missing name or email');
        continue;
      }

      // Check if attendee already exists
      const existing = await prisma.attendee.findUnique({ where: { email } });
      if (existing) continue;

      // Collect all columns data
      const extraData: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (index !== nameCol && index !== emailCol && index !== phoneCol) {
          const value = rowData[header]?.toString().trim();
          if (value) {
            extraData[header] = value;
          }
        }
      });

      // Generate unique QR code
      const qrData = JSON.stringify({ name, email, phone });
      const qrCode = await QRCode.toDataURL(qrData);

      attendees.push({
        name,
        email,
        phone,
        qrData,
        qrCode,
        nameCol: headers[nameCol],
        emailCol: headers[emailCol],
        phoneCol: phoneCol !== -1 ? headers[phoneCol] : null,
        extraData: Object.keys(extraData).length > 0 ? JSON.stringify(extraData) : null,
      });
    }

    let uploadedCount = 0;
    for (const attendee of attendees) {
      try {
        await prisma.attendee.create({ data: attendee });
        uploadedCount++;
      } catch (error) {
        // Skip if duplicate or other error
        console.log('Skipped attendee:', attendee.name, (error as Error).message);
      }
    }

    return NextResponse.json({ message: 'Attendees uploaded successfully', count: uploadedCount });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: `Upload failed: ${(error as Error).message}` }, { status: 500 });
  }
}