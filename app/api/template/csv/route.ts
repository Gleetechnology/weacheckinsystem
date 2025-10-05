import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import * as XLSX from 'xlsx';

export async function GET() {
  const headers = ['ID', '번호', '한글', '직분', '영어', '영어직분', 'Full Name', '열2', 'Organization', 'Preferred Title (Optional)', 'Position in Organization', 'Region of Work'];
  const sampleData = [
    headers,
    ['1', '001', '김철수', '과장', 'John Doe', 'Manager', 'John Doe', 'Additional', 'ABC Corp', 'Mr.', 'Manager', 'Seoul']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="attendee_template.xlsx"',
    },
  });
}