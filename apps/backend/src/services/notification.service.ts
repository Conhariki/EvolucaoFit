import * as admin from 'firebase-admin';
import { User } from '../models/User';

class NotificationService {
  async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    try {
      const user = await User.findById(userId);
      if (!user?.fcmToken) return;

      const message: admin.messaging.Message = {
        token: user.fcmToken,
        notification: {
          title,
          body,
        },
        data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      await admin.messaging().send(message);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async sendMeasurementReminder(userId: string) {
    const user = await User.findById(userId);
    if (!user?.notificationSettings.reminders) return;

    await this.sendNotification(
      userId,
      'Time to Track Your Progress!',
      'Don\'t forget to update your measurements today.',
      { type: 'reminder', action: 'measurements' }
    );
  }

  async sendPhotoReminder(userId: string) {
    const user = await User.findById(userId);
    if (!user?.notificationSettings.reminders) return;

    await this.sendNotification(
      userId,
      'Capture Your Progress!',
      'Take a progress photo to track your transformation.',
      { type: 'reminder', action: 'photos' }
    );
  }

  async notifyProfessorNewMeasurement(professorId: string, studentName: string) {
    await this.sendNotification(
      professorId,
      'New Measurement Update',
      `${studentName} has updated their measurements.`,
      { type: 'measurement', action: 'view' }
    );
  }

  async notifyProfessorNewPhoto(professorId: string, studentName: string) {
    await this.sendNotification(
      professorId,
      'New Progress Photo',
      `${studentName} has uploaded a new progress photo.`,
      { type: 'photo', action: 'view' }
    );
  }
}

export const notificationService = new NotificationService(); 