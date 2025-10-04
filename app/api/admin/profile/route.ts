import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; username: string };
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          email: true,
          profilePicture: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!admin) {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      }

      return NextResponse.json({ admin });
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching admin profile:', error);
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
    const { email, firstName, lastName, profilePicture, currentPassword, newPassword } = body;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; username: string };

      // Get current admin data
      const currentAdmin = await prisma.admin.findUnique({
        where: { id: decoded.id }
      });

      if (!currentAdmin) {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      }

      // Verify current password if changing password
      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, currentAdmin.password);
        if (!isValidPassword) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
      }

      // Prepare update data
      const updateData: any = {
        email: email !== undefined ? email : currentAdmin.email,
        firstName: firstName !== undefined ? firstName : currentAdmin.firstName,
        lastName: lastName !== undefined ? lastName : currentAdmin.lastName,
        profilePicture: profilePicture !== undefined ? profilePicture : currentAdmin.profilePicture,
      };

      // Hash new password if provided
      if (newPassword) {
        updateData.password = await bcrypt.hash(newPassword, 10);
      }

      // Update admin
      const updatedAdmin = await prisma.admin.update({
        where: { id: decoded.id },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          profilePicture: true,
          firstName: true,
          lastName: true,
          updatedAt: true
        }
      });

      return NextResponse.json({
        message: 'Profile updated successfully',
        admin: updatedAdmin
      });
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}