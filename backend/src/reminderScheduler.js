import cron from 'node-cron';
import Appointment from './models/Appointment.js';
import { emitAppointmentReminder, emitAppointmentStarted } from './lib/socket.js';

const REMINDER_TIME_MINUTES = 5; // Send reminder 5 minutes before appointment
const CHECK_INTERVAL_SECONDS = 30; // Check every 30 seconds

// Set to track which appointments we've already sent reminders for
const sentReminders = new Set();
const startedAppointments = new Set();

export const startReminderScheduler = () => {
  console.log('🚀 Starting appointment reminder scheduler...');

  // Check every 30 seconds for upcoming appointments
  const scheduler = cron.schedule(`*/${CHECK_INTERVAL_SECONDS} * * * * *`, async () => {
    try {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + REMINDER_TIME_MINUTES * 60000);
      const startedTime = new Date(now.getTime() + 1 * 60000); // 1 minute window for started appointments

      // Find appointments that are due for reminder (5 minutes before start)
      const upcomingAppointments = await Appointment.find({
        startTime: {
          $gte: now,
          $lte: reminderTime,
        },
        status: { $in: ['pending', 'confirmed', 'scheduled', 'accepted'] },
      })
        .populate('userId', 'fullName')
        .populate('friendId', 'fullName')
        .lean();

      // Send reminders for upcoming appointments
      for (const appointment of upcomingAppointments) {
        const reminderId = `${appointment._id}-reminder`;
        
        if (!sentReminders.has(reminderId)) {
          console.log(`📨 Sending reminder for appointment: ${appointment.title}`);
          
          // Send reminder to both users
          emitAppointmentReminder(appointment.userId._id, appointment);
          emitAppointmentReminder(appointment.friendId._id, appointment);
          
          sentReminders.add(reminderId);
        }
      }

      // Find appointments that are starting right now
      const startingAppointments = await Appointment.find({
        startTime: {
          $lte: startedTime,
          $gte: now,
        },
        status: { $in: ['pending', 'confirmed', 'scheduled', 'accepted'] },
      })
        .populate('userId', 'fullName')
        .populate('friendId', 'fullName')
        .lean();

      // Send started notifications
      for (const appointment of startingAppointments) {
        const startedId = `${appointment._id}-started`;
        
        if (!startedAppointments.has(startedId)) {
          console.log(`⏱️ Appointment started: ${appointment.title}`);
          
          emitAppointmentStarted(
            appointment._id,
            appointment.userId._id,
            appointment.friendId._id
          );
          
          startedAppointments.add(startedId);
        }
      }

      // Clean up old entries (remove entries older than 1 hour)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      for (const reminderId of sentReminders) {
        try {
          const appointmentId = reminderId.split('-')[0];
          const appointment = await Appointment.findById(appointmentId).lean();
          if (appointment && appointment.startTime < oneHourAgo) {
            sentReminders.delete(reminderId);
            startedAppointments.delete(`${appointmentId}-started`);
          }
        } catch (err) {
          console.error('Error cleaning up reminders:', err.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in reminder scheduler:', error.message);
    }
  });

  return scheduler;
};

export const stopReminderScheduler = (scheduler) => {
  if (scheduler) {
    scheduler.stop();
    console.log('⏹️ Reminder scheduler stopped');
  }
};
