import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import jwt from 'jsonwebtoken';
import { uploadImageBuffer } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET!) as { id: string; username: string };
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
    }

    // Prepare upload
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `profile_${timestamp}_${randomString}.${extension}`;

    // Read file bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary (serverless-friendly)
    const secureUrl = await uploadImageBuffer(buffer, 'wea/profiles', filename);

    return NextResponse.json({ url: secureUrl, filename });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    // Provide helpful message when Cloudinary isn't configured
    if (process.env.CLOUDINARY_CLOUD_NAME == null) {
      return NextResponse.json({
        error: 'Upload failed: Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in environment.'
      }, { status: 500 });
    }
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
