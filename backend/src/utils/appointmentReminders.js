import cron from 'node-cron';
import Appointment from '../models/Appointment.js';
import { createNotification } from '../controllers/notifications.controller.js';

// Run every 5 minutes to check for upcoming appointments
export function startReminderScheduler() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      
      // Find appointments that:
      // 1. Are in the future
      // 2. Are accepted/confirmed
      // 3. Haven't been reminded yet
      const appointments = await Appointment.find({
        startTime: { $gt: now },
        status: { $in: ['accepted', 'confirmed'] },
        reminded: { $ne: true },
      }).populate(['userId', 'friendId']);

      console.log(`🔔 Checking ${appointments.length} appointments for reminders...`);

      for (const appointment of appointments) {
        const timeUntilStart = appointment.startTime.getTime() - now.getTime();
        const minutesUntilStart = timeUntilStart / (1000 * 60);
        const reminderMinutes = appointment.reminder || 15;

        // If we're within the reminder window (and still in the future), send notification
        if (minutesUntilStart <= reminderMinutes && minutesUntilStart > 0) {
          const formattedDate = appointment.startTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          const formattedTime = appointment.startTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });

          // Send reminder to both participants
          const participants = [
            { 
              id: appointment.userId._id.toString(), 
              partnerName: appointment.friendId.fullName,
              partnerId: appointment.friendId._id.toString()
            },
            { 
              id: appointment.friendId._id.toString(), 
              partnerName: appointment.userId.fullName,
              partnerId: appointment.userId._id.toString()
            },
          ];

          for (const participant of participants) {
            try {
              await createNotification({
                recipientId: participant.id,
                senderId: participant.partnerId,
                type: 'appointment',
                title: '⏰ Upcoming Appointment Reminder',
                message: `Your appointment with ${participant.partnerName} starts in ${Math.round(minutesUntilStart)} minutes (${formattedDate} at ${formattedTime})`,
                appointmentId: appointment._id,
              });
              
              console.log(`✅ Sent reminder to user ${participant.id} for appointment ${appointment._id}`);
            } catch (notifError) {
              console.error(`Failed to send notification to ${participant.id}:`, notifError.message);
            }
          }

          // Mark as reminded
          appointment.reminded = true;
          await appointment.save();
          
          console.log(`📅 Appointment ${appointment._id} marked as reminded`);
        }
      }
    } catch (error) {
      console.error('❌ Error in reminder scheduler:', error.message);
    }
  });
  
  console.log('📅 Appointment reminder scheduler started - running every 5 minutes');
}

// Optional: Function to manually trigger reminders (useful for testing)
export async function checkRemindersNow() {
  console.log('🔔 Manually checking for appointment reminders...');
  try {
    const now = new Date();
    
    const appointments = await Appointment.find({
      startTime: { $gt: now },
      status: { $in: ['accepted', 'confirmed'] },
      reminded: { $ne: true },
    }).populate(['userId', 'friendId']);

    console.log(`Found ${appointments.length} appointments to check`);

    for (const appointment of appointments) {
      const timeUntilStart = appointment.startTime.getTime() - now.getTime();
      const minutesUntilStart = timeUntilStart / (1000 * 60);
      const reminderMinutes = appointment.reminder || 15;

      console.log(`Appointment ${appointment._id}: ${minutesUntilStart} mins until start, reminder set for ${reminderMinutes} mins`);

      if (minutesUntilStart <= reminderMinutes && minutesUntilStart > 0) {
        const formattedDate = appointment.startTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const formattedTime = appointment.startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });

        const participants = [
          { 
            id: appointment.userId._id.toString(), 
            partnerName: appointment.friendId.fullName,
            partnerId: appointment.friendId._id.toString()
          },
          { 
            id: appointment.friendId._id.toString(), 
            partnerName: appointment.userId.fullName,
            partnerId: appointment.userId._id.toString()
          },
        ];

        for (const participant of participants) {
          await createNotification({
            recipientId: participant.id,
            senderId: participant.partnerId,
            type: 'appointment',
            title: '⏰ Upcoming Appointment Reminder',
            message: `Your appointment with ${participant.partnerName} starts in ${Math.round(minutesUntilStart)} minutes (${formattedDate} at ${formattedTime})`,
            appointmentId: appointment._id,
          });
        }

        appointment.reminded = true;
        await appointment.save();
        
        console.log(`✅ Sent reminders for appointment ${appointment._id}`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking reminders:', error.message);
  }
}