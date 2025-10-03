import { prisma } from './prisma';

export interface CreateNotificationData {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  attendeeId?: string;
  adminId?: string;
}

/**
 * Create a new notification in the database
 */
export async function createNotification(data: CreateNotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        attendeeId: data.attendeeId,
        adminId: data.adminId,
      },
    });

    return { success: true, notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

/**
 * Create notification for new attendee registration
 */
export async function notifyNewAttendee(attendeeName: string, attendeeId?: string) {
  return createNotification({
    title: 'New Attendee Registered',
    message: `${attendeeName} has completed registration and received their QR code.`,
    type: 'success',
    attendeeId,
  });
}

/**
 * Create notification for attendee check-in
 */
export async function notifyAttendeeCheckin(attendeeName: string, attendeeId?: string) {
  return createNotification({
    title: 'Attendee Checked In',
    message: `${attendeeName} has successfully checked in to the event.`,
    type: 'success',
    attendeeId,
  });
}

/**
 * Create notification for bulk upload completion
 */
export async function notifyBulkUpload(count: number, errors: number = 0) {
  const title = 'Bulk Upload Completed';
  let message = `${count} attendees were successfully uploaded.`;

  if (errors > 0) {
    message += ` ${errors} errors occurred during upload.`;
  }

  return createNotification({
    title,
    message,
    type: errors > 0 ? 'warning' : 'success',
  });
}

/**
 * Create notification for system events
 */
export async function notifySystemEvent(title: string, message: string, type: 'info' | 'warning' | 'error' = 'info') {
  return createNotification({
    title,
    message,
    type,
  });
}

/**
 * Get recent notifications
 */
export async function getRecentNotifications(limit: number = 10) {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { success: true, notifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return { success: true, notification };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount() {
  try {
    const count = await prisma.notification.count({
      where: { read: false },
    });

    return { success: true, count };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { success: false, error };
  }
}