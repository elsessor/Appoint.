# Enhanced Appointment Booking System - Feature Documentation

## Overview

The appointment booking system has been significantly enhanced with a larger sliding modal interface, advanced time management, and comprehensive appointment request handling with accountability features.

---

## 1. Enhanced Appointment Modal

### Features

#### 1.1 Sliding Modal Interface
- **Large, full-screen modal** that slides in from the right side
- Provides more space for appointment details and information
- Persistent header with appointment information (ID, action type)
- Smooth transitions and backdrop overlay

#### 1.2 Duration Management
- **Duration Selection**: Users can choose from preset durations:
  - 15, 30, 45, 60, 90, 120 minutes
- **Auto-calculated End Time**: End time is automatically calculated based on selected duration
- **Dynamic Duration Change**: Changing duration updates end time in real-time

#### 1.3 Time Slot Constraints
- **Cannot Schedule in Past**: Validation prevents scheduling appointments before the current date/time
- **Today's Time Slots**: If booking for today, only future time slots are available
- **Clear Error Messages**: Users are notified when attempting invalid scheduling

#### 1.4 Appointment Summary
- Shows a preview of appointment details:
  - Title
  - Date & Time
  - Duration
  - Meeting Type
  - Scheduled with (Friend Name)
- Helps users review before confirming

### Implementation

```jsx
// Time slot generation with constraints
const generateTimeSlots = useMemo(() => {
  const slots = [];
  const now = new Date();
  const selectedDate = initialDate ? new Date(initialDate) : new Date();
  const isSelectedToday = isToday(selectedDate);

  while (current < end) {
    const isDisabled = isSelectedToday && isBefore(current, now);
    slots.push({ time: slotTime, disabled: isDisabled });
    current = addMinutes(current, duration);
  }

  return slots;
}, [availability, initialDate]);
```

---

## 2. Appointment Cancellation with Accountability

### Cancellation Workflow

1. **User clicks "Cancel Appointment"**
2. Modal transitions to cancellation form
3. **User selects reason** from predefined list:
   - Schedule Conflict
   - Unexpected Emergency
   - Weather Issues
   - Technical Difficulties
   - Personal Reasons
   - Other (Please specify)

4. **If "Other" selected**: Custom reason textarea appears
5. **Confirmation**: User confirms cancellation
6. **Notification**: Other party is notified with reason

### Data Stored

```javascript
{
  status: 'cancelled',
  cancellationReason: 'Schedule Conflict' || 'Custom reason text',
  cancelledAt: timestamp,
  cancelledBy: userId
}
```

### Accountability Features

- **Immutable Record**: Cancellation reason is permanently stored
- **Audit Trail**: All cancellations are tracked with timestamps
- **Transparency**: Reason is shared with the other participant

---

## 3. Appointment Request Management

### Accept/Decline System

#### 3.1 Appointment Request Modal

A dedicated modal for handling incoming appointment requests with:

**Request Details Section**:
- Requester's profile (name, avatar, email, learning language)
- Full appointment details (title, date, time, duration, meeting type)
- Appointment summary card

**Action Buttons**:
- ✅ **Accept**: Confirm the appointment
- ❌ **Decline**: Reject with message
- ⏰ **Later**: Review later without deciding

#### 3.2 Declining with Message

When declining, users must provide a message explaining why:

**Features**:
- Required message field (cannot decline without reason)
- Full textarea for detailed explanation
- Clear messaging about who will see the response
- Cannot proceed with empty message

**Data Stored**:
```javascript
{
  status: 'declined',
  declinedReason: 'User message text',
  declinedAt: timestamp,
  declinedBy: userId
}
```

### Acceptance Flow

1. **User clicks "Accept"**
2. Appointment status changes to `confirmed`
3. Requester is notified immediately
4. Modal closes automatically
5. Toast confirmation shown to user

---

## 4. Status Management

### Appointment Statuses

| Status | Description | Color | Action Available |
|--------|-------------|-------|-------------------|
| `pending` | Awaiting response from recipient | Yellow | Accept/Decline |
| `scheduled` | Created but awaiting confirmation | Blue | Can be edited/cancelled |
| `confirmed` | Accepted by both parties | Green | Can be cancelled with reason |
| `declined` | Rejected by recipient | Red | View reason |
| `cancelled` | Cancelled by participant | Gray | View reason |

### Status Flow Diagram

```
pending → confirmed (Accept)
   ↓
  ├→ declined (Decline with reason)
   ↓
scheduled → confirmed (Accept when sent)
   ↓
    └→ cancelled (Cancel with reason)
```

---

## 5. Component Integration

### AppointmentModal
- Handles creation and editing of appointments
- Manages cancellation forms
- Auto-calculates appointment end times
- Validates past date/time constraints

### AppointmentRequestModal (New)
- Displays incoming appointment requests
- Handles acceptance/decline flows
- Shows requester information
- Manages decline message collection

### AppointmentBookingPage (Updated)
- Displays pending requests alert
- Manages all appointment mutations
- Shows appointment request modal when clicked
- Filters today's appointments with status indicators

---

## 6. Time Constraints Implementation

### Past Date Prevention

```javascript
const handleSubmit = (e) => {
  e.preventDefault();
  
  const startDateTime = parseISO(formData.startTime);
  const now = new Date();
  
  if (isBefore(startDateTime, now)) {
    alert('Cannot schedule an appointment in the past');
    return;
  }
  
  onSubmit(formData);
};
```

### Time Slot Validation

- Generated time slots check against current time
- Disabled attribute prevents selection of past times
- Visual indication (opacity/disabled styling) shows unavailable slots

---

## 7. API Integration Points

### Required API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/appointments` | Create appointment |
| PUT | `/appointments/:id` | Update appointment status (accept/decline) |
| DELETE | `/appointments/:id` | Delete/cancel appointment |
| GET | `/appointments` | Fetch all appointments |

### Mutation Payloads

**Accept Appointment**:
```javascript
PUT /appointments/:id
{
  status: 'confirmed'
}
```

**Decline Appointment**:
```javascript
PUT /appointments/:id
{
  status: 'declined',
  declinedReason: 'User message'
}
```

**Cancel Appointment**:
```javascript
DELETE /appointments/:id
{
  cancellationReason: 'Reason text'
}
```

---

## 8. User Experience Features

### Visual Feedback
- Loading states during API calls
- Toast notifications for success/error
- Alert banners for pending requests
- Status badges with color coding

### Error Handling
- Validation before form submission
- User-friendly error messages
- Prevention of invalid state changes

### Accessibility
- Clear labels and descriptions
- Disabled state styling
- Informative placeholder text
- Semantic HTML structure

---

## 9. Usage Examples

### Creating an Appointment

```javascript
const handleCreateAppointment = (appointmentData) => {
  createAppointmentMutation.mutate({
    title: 'Project Discussion',
    friendId: 'friend_123',
    startTime: '2025-12-01T14:00',
    endTime: '2025-12-01T14:30', // Auto-calculated
    duration: 30,
    meetingType: 'Video Call',
    description: 'Discuss project timeline',
    status: 'scheduled'
  });
};
```

### Cancelling an Appointment

```javascript
const handleCancelAppointment = (appointmentId, reason) => {
  // Modal shows cancellation form
  // User selects or enters reason
  deleteAppointmentMutation.mutate({
    id: appointmentId,
    cancellationReason: 'Unexpected Emergency' // or custom text
  });
};
```

### Handling Request Response

```javascript
const handleAcceptAppointment = (appointmentId) => {
  acceptAppointmentMutation.mutate(appointmentId);
  // Status changes to 'confirmed'
};

const handleDeclineAppointment = (appointmentId, reason) => {
  declineAppointmentMutation.mutate({
    appointmentId,
    reason: 'Cannot make it due to schedule conflict'
  });
};
```

---

## 10. Future Enhancements

Potential additions for future versions:

1. **Recurring Appointments**: Support for weekly/monthly repeating appointments
2. **Calendar Integration**: Sync with Google Calendar, Outlook
3. **Notifications**: Email/SMS reminders before appointments
4. **Video Integration**: Direct video call links in appointment
5. **Availability Templates**: Save regular availability patterns
6. **Rescheduling**: Allow proposing new times when declining
7. **Analytics**: Track appointment completion rates
8. **Timezone Support**: Handle different timezones for international users

---

## 11. Testing Checklist

- [ ] Create appointment with valid data
- [ ] Prevent past date/time selection
- [ ] Auto-calculate end time with different durations
- [ ] Cancel appointment with predefined reason
- [ ] Cancel appointment with custom reason
- [ ] Accept appointment request
- [ ] Decline appointment with message (required)
- [ ] View pending request alert
- [ ] Modal closes after action
- [ ] Toast notifications display correctly
- [ ] Status badges show correct colors
- [ ] Responsive on mobile/tablet

---

## File Structure

```
src/
├── components/
│   └── appointments/
│       ├── AppointmentModal.jsx (ENHANCED)
│       ├── AppointmentRequestModal.jsx (NEW)
│       ├── Calendar.jsx
│       └── DayDetailsModal.jsx
├── pages/
│   └── AppointmentBookingPage.jsx (UPDATED)
└── lib/
    └── api.js (update endpoints as needed)
```

