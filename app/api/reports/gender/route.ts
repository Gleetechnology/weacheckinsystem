import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { createPrismaClient } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const prisma = createPrismaClient();
  try {
    // Gender field doesn't exist in the Attendee model
    // Return empty data to prevent page crashes
    return NextResponse.json({
      data: [],
      success: true,
    });
  } catch (error) {
    console.error('Error fetching gender data:', error);
    // Return empty data instead of error to prevent page crashes
    return NextResponse.json({
      data: [],
      success: true,
    });
  } finally {
    await prisma.$disconnect();
  }
}