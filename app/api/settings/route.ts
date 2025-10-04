import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const settings = await prisma.setting.findMany({
      orderBy: { category: 'asc' }
    });

    // Convert settings to key-value pairs
    const settingsMap: Record<string, any> = {};
    settings.forEach(setting => {
      if (setting.type === 'boolean') {
        settingsMap[setting.key] = setting.value === 'true';
      } else if (setting.type === 'number') {
        settingsMap[setting.key] = parseFloat(setting.value);
      } else if (setting.type === 'json') {
        try {
          settingsMap[setting.key] = JSON.parse(setting.value);
        } catch {
          settingsMap[setting.key] = setting.value;
        }
      } else {
        settingsMap[setting.key] = setting.value;
      }
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const body = await request.json();
    const updates = body.settings;

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
    }

    // Update each setting
    const updatePromises = Object.entries(updates).map(async ([key, value]) => {
      let valueStr: string;
      let type: string;

      if (typeof value === 'boolean') {
        valueStr = value.toString();
        type = 'boolean';
      } else if (typeof value === 'number') {
        valueStr = value.toString();
        type = 'number';
      } else if (typeof value === 'object') {
        valueStr = JSON.stringify(value);
        type = 'json';
      } else {
        valueStr = String(value);
        type = 'string';
      }

      return prisma.setting.upsert({
        where: { key },
        update: { value: valueStr, type },
        create: {
          key,
          value: valueStr,
          type,
          category: 'general' // Default category
        }
      });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}