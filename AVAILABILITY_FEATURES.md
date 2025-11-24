# Availability System Enhancements - Implementation Guide

## Overview

Three high-impact availability features have been implemented to enhance the appointment booking system:

1. **Break Times** - Set recurring daily breaks (e.g., lunch hour)
2. **Lead Time & Notice Period** - Control booking advance notice requirements
3. **Quick Availability Toggle** - One-click status changes (Available/Limited/Away)

---

## Features Implemented

### 1. Break Times / Lunch Hours

**Purpose**: Prevent scheduling during fixed daily breaks

**How it works**:
- Users can set multiple recurring break times
- Break times apply every day during working hours
- Prevents friends from booking appointments during these times

**Configuration**:
- Location: Availability Settings → Break Times
- Format: Start time and end time (e.g., 12:00-13:00)
- Can add multiple breaks per day

**Backend Validation**:
- `isWithinBreakTime()` in `availabilityUtils.js` checks if a slot overlaps with break times
- Appointment creation fails if time slot conflicts with break

**Example**:
```javascript
breakTimes: [
  { start: "12:00", end: "13:00" },  // Lunch
  { start: "15:00", end: "15:30" },  // Coffee break
]
```

---

### 2. Lead Time & Notice Period

**Purpose**: Control booking and cancellation constraints

#### Minimum Lead Time
- **What**: Minimum hours required before booking an appointment
- **Use case**: "Can't book within 2 hours"
- **Default**: 0 (anytime bookings allowed)
- **Range**: 0-168 hours (7 days)

#### Cancellation Notice
- **What**: Hours required before appointment to cancel
- **Use case**: "Must cancel 24 hours ahead"
- **Default**: 0 (cancel anytime)
- **Range**: 0-168 hours (7 days)

**Configuration**:
- Location: Availability Settings → Booking Rules
- Set values in hours
- Helper text shows friendly messages

**Backend Validation**:
- `checkLeadTime()` validates minimum booking advance
- `canCancelAppointment()` validates cancellation timing
- Prevents bookings that don't meet lead time requirement

**Example**:
```javascript
availability: {
  minLeadTime: 2,      // Must book 2+ hours in advance
  cancelNotice: 24,    // Must cancel 24+ hours before
}
```

---

### 3. Quick Availability Toggle

**Purpose**: One-click status changes without opening settings

**Status Options**:
- **Available** ✓ - Friends can book appointments
- **Limited** ⚠ - Show limited availability
- **Away** ✕ - Not accepting bookings

**How to Use**:
1. Click status button in navbar/dashboard
2. Select new status from dropdown
3. Status updates immediately
4. All existing settings preserved

**Component**: `AvailabilityStatusToggle.jsx`
- Dropdown button showing current status
- Easy one-click switching
- Visual indicators with colors and icons
- Toast notifications on change

**Example**:
```jsx
import AvailabilityStatusToggle from './components/AvailabilityStatusToggle';

<AvailabilityStatusToggle 
  currentUser={user}
  onStatusChange={(newStatus) => console.log(newStatus)}
/>
```

---

## Database Schema Updates

### User Model
```javascript
availability: {
  days: [Number],              // Days available (0-6)
  start: String,               // Start time (HH:MM)
  end: String,                 // End time (HH:MM)
  slotDuration: Number,        // Minutes per slot
  buffer: Number,              // Buffer between appointments
  maxPerDay: Number,           // Max appointments per day
  breakTimes: [                // NEW: Daily recurring breaks
    { start: String, end: String }
  ],
  minLeadTime: {               // NEW: Minimum booking advance (hours)
    type: Number,
    default: 0,
  },
  cancelNotice: {              // NEW: Cancellation notice (hours)
    type: Number,
    default: 0,
  },
  appointmentDuration: {       // NEW: Duration rules
    min: Number,               // Minimum (minutes)
    max: Number,               // Maximum (minutes)
  },
}

availabilityStatus: {          // NEW: Quick toggle status
  type: String,
  enum: ["available", "limited", "away"],
  default: "available",
}
```

### Appointment Model
```javascript
appointmentDuration: {         // NEW: Booked duration
  type: Number,
  required: true,
  min: 15,
  max: 480,
}

availability: {
  // Existing fields + new ones
  breakTimes: [
    { start: String, end: String }
  ],
  minLeadTime: Number,
  cancelNotice: Number,
}
```

---

## API Endpoints

### Save/Update Availability
**POST** `/appointments/availability`

**Request Body**:
```json
{
  "days": [1, 2, 3, 4, 5],
  "start": "09:00",
  "end": "17:00",
  "slotDuration": 30,
  "buffer": 15,
  "maxPerDay": 5,
  "breakTimes": [
    { "start": "12:00", "end": "13:00" }
  ],
  "minLeadTime": 2,
  "cancelNotice": 24,
  "appointmentDuration": {
    "min": 15,
    "max": 120
  },
  "availabilityStatus": "available"
}
```

**Response**:
```json
{
  "message": "Availability saved successfully",
  "availability": { /* full availability object */ },
  "availabilityStatus": "available"
}
```

### Get Availability
**GET** `/appointments/availability/:userId`

**Response**:
```json
{
  "availability": { /* full availability object */ },
  "availabilityStatus": "available"
}
```

---

## Utility Functions

### In `backend/src/utils/availabilityUtils.js`:

#### `isWithinBreakTime(slotStart, slotEnd, breakTimes)`
Checks if a time slot overlaps with break times.

#### `checkLeadTime(appointmentStart, minLeadHours)`
Validates if appointment meets minimum lead time requirement.

#### `canCancelAppointment(appointmentStart, cancelNoticeHours)`
Checks if appointment can be cancelled (respects cancel notice).

#### `validateAppointmentDuration(durationMinutes, durationRules)`
Validates duration against min/max rules.

#### `getAvailableSlots(date, availability, existingAppointments)`
Calculates available time slots for a day (considers breaks and appointments).

---

## Frontend Components

### 1. AvailabilitySettings.jsx
**Features**:
- Set working hours and available days
- Add/remove daily break times
- Configure slot duration, buffer, max appointments
- Set lead time and cancel notice
- Configure appointment duration rules
- Add custom specific-date slots

**Props**: `{ isOpen, onClose, currentUser }`

### 2. AvailabilityStatusToggle.jsx
**Features**:
- Dropdown for quick status changes
- Available/Limited/Away options
- Preserves all existing settings
- Toast notifications

**Props**: `{ currentUser, onStatusChange }`

### 3. AvailabilityInfo.jsx
**Features**:
- Displays availability summary
- Shows break times
- Shows lead time and cancel notice
- Color-coded status indicator

**Props**: `{ availability, availabilityStatus }`

---

## Validation Logic

### During Appointment Creation

1. **Duration Validation**
   - Appointment duration must be 15-480 minutes
   - Must fit within friend's min/max duration rules

2. **Lead Time Check**
   - If minLeadTime = 2, can't book within 2 hours
   - Current time + 2 hours must be before appointment start

3. **Break Time Check**
   - Appointment time must not overlap with break times
   - Converts times to HH:MM for comparison

4. **Status Check**
   - If availabilityStatus = 'away', booking rejected
   - 'limited' and 'available' allow bookings

### Example Validation Flow
```
User creates appointment for friend
  ↓
Check friend's status (not 'away'?)
  ↓
Check lead time (advance notice sufficient?)
  ↓
Check duration (within min/max?)
  ↓
Check break times (no overlap?)
  ↓
Appointment created / Error returned
```

---

## Integration with Existing Code

### In AppointmentBookingPage.jsx
```jsx
import AvailabilityStatusToggle from '../components/AvailabilityStatusToggle';
import AvailabilityInfo from '../components/AvailabilityInfo';

// Add status toggle in header
<AvailabilityStatusToggle 
  currentUser={currentUser}
  onStatusChange={() => queryClient.invalidateQueries('appointments')}
/>

// Show availability info in sidebar/details
<AvailabilityInfo 
  availability={selectedFriend?.availability}
  availabilityStatus={selectedFriend?.availabilityStatus}
/>
```

### In Calendar.jsx
Calendar already displays appointments considering availability settings. Break times are enforced during slot generation.

---

## Error Handling

### Common Errors

1. **"Bookings require at least 2 hours advance notice"**
   - User tried to book too close to current time
   - Show minLeadTime requirement to user

2. **"This time slot overlaps with a break time"**
   - Selected slot is during break time
   - Show available break times
   - Suggest alternative slots

3. **"Appointment duration must be between 15 and 120 minutes"**
   - Duration outside allowed range
   - Show min/max duration rules

4. **"This user is currently away and not accepting bookings"**
   - Friend's status is 'away'
   - Check back later

---

## User Experience Flow

### Setting Up Availability

1. Open Availability Settings (⚙️ icon or Settings menu)
2. Set working hours (e.g., 9:00-17:00)
3. Select available days (Mon-Fri)
4. Add break times (e.g., 12:00-13:00 lunch)
5. Set lead time requirement (e.g., 2 hours)
6. Set cancel notice (e.g., 24 hours)
7. Click "Save Changes"

### Using Quick Toggle

1. Click status button in navbar (✓/⚠/✕)
2. Select new status from dropdown
3. Status changes immediately
4. All settings preserved

### Booking Consideration

When booking with a friend:
- Calendar shows available slots only
- Unavailable times greyed out or hidden
- Break times appear blocked
- Can't book within lead time window
- Confirm cancel notice when making booking

---

## Testing Checklist

- [ ] Can add/remove break times
- [ ] Break times prevent booking
- [ ] Lead time requirement enforced
- [ ] Can't cancel within cancel notice window
- [ ] Quick toggle changes status immediately
- [ ] Status dropdown shows all 3 options
- [ ] Away status prevents bookings
- [ ] Duration rules enforced
- [ ] All settings saved to database
- [ ] Can view availability summary
- [ ] Toast notifications show on actions

---

## Future Enhancements

Some related features mentioned in the suggestions that could be implemented next:

1. **Appointment Duration Variations**
   - Different types (30-min meeting vs 1-hour consultation)
   - Separate availability slots per type

2. **Availability Templates**
   - Save presets (Summer, Teaching Hours, On-Call)
   - Quick switch between templates

3. **Recurring Patterns**
   - Every 2 weeks off pattern
   - Seasonal variations

4. **Timezone Support**
   - Store user timezone
   - Auto-convert appointment times

5. **Double Booking Prevention**
   - Mark time as busy before confirming
   - Temporary slot holds during booking

---

## Support

For issues or questions about the availability system:
1. Check error messages for specific validation failures
2. Review this documentation
3. Check browser console for API errors
4. Verify database fields match User/Appointment schemas
