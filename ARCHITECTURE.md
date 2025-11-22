# Availability System Architecture

## Feature Overview

```
┌─────────────────────────────────────────────────────────────┐
│           AVAILABILITY SYSTEM ENHANCEMENTS                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. BREAK TIMES              2. LEAD TIME               3. STATUS TOGGLE
│  ├─ Set daily breaks         ├─ Min booking advance    ├─ Available
│  ├─ Multiple per day         ├─ Cancel notice          ├─ Limited  
│  └─ Prevents booking         └─ Enforced validation    └─ Away
│
└─────────────────────────────────────────────────────────────┘
```

---

## Validation Flow

```
┌─────────────────────────────┐
│   User Creates Appointment  │
└──────────────┬──────────────┘
               │
               ▼
        ┌──────────────┐
        │ Check Status │
        └──────┬───────┘
               │
        ┌──────▼──────┐
        │  Away? (X)  │──NO──▶ Check Lead Time
        │ Limited (✓) │       
        │ Available(✓)│       
        └──────┬──────┘
               │ YES
               ▼
        ❌ REJECTED
        "User is away"


        Check Lead Time
        ┌─────────────────────┐
        │ Now + minLeadTime   │
        │ < Appointment Time? │
        └────────┬────────────┘
                 │
        ┌────────▼─────────┐
        │  Sufficient? (✓) │──YES──▶ Check Break Times
        │                  │
        │ Insufficient (X) │
        └────────┬─────────┘
                 │ NO
                 ▼
        ❌ REJECTED
        "Requires X hours notice"


        Check Break Times
        ┌──────────────────────────┐
        │ Does appointment overlap │
        │ with any breakTime?       │
        └────────┬─────────────────┘
                 │
        ┌────────▼─────────┐
        │  Overlaps? (X)   │──NO──▶ Check Duration
        │ Clear? (✓)       │
        └────────┬─────────┘
                 │ YES
                 ▼
        ❌ REJECTED
        "Overlaps with break time"


        Check Duration
        ┌──────────────────────────┐
        │ Is duration between      │
        │ min and max?             │
        └────────┬─────────────────┘
                 │
        ┌────────▼──────────────┐
        │  Valid? (✓)           │──YES──▶ ✅ CREATE APPOINTMENT
        │ Invalid (X)           │
        └────────┬──────────────┘
                 │ NO
                 ▼
        ❌ REJECTED
        "Duration must be X-Y minutes"
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  AvailabilitySettings.jsx    AvailabilityStatusToggle.jsx  │
│  ┌──────────────────────┐    ┌─────────────────────────┐   │
│  │ Full configuration   │    │ Quick status switch     │   │
│  │ - Break times        │    │ - Available             │   │
│  │ - Lead time          │    │ - Limited               │   │
│  │ - Cancel notice      │    │ - Away                  │   │
│  │ - Slot config        │    │                         │   │
│  └────────┬─────────────┘    └────────┬────────────────┘   │
│           │                           │                     │
│           └───────────┬────────────────┘                     │
│                       │                                      │
│                 POST /appointments/availability             │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js/Express)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  appointments.controller.js                                  │
│  ├─ saveCustomAvailability()     ◄─────── Save settings     │
│  │  └─ Updates user.availability & availabilityStatus       │
│  │                                                            │
│  └─ createAppointment()         ◄─────── Create with validation
│     ├─ checkLeadTime()          (utils)                     │
│     ├─ isWithinBreakTime()      (utils)                     │
│     ├─ validateAppointmentDuration() (utils)                │
│     └─ Check availabilityStatus                             │
│                                                               │
│  availabilityUtils.js                                        │
│  ├─ checkLeadTime()                                          │
│  ├─ isWithinBreakTime()                                      │
│  ├─ validateAppointmentDuration()                            │
│  ├─ getAvailableSlots()                                      │
│  └─ Helper message functions                                │
│                                                               │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               DATABASE (MongoDB)                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User Collection                Appointment Collection       │
│  ├─ availabilityStatus          ├─ appointmentDuration      │
│  └─ availability:               └─ availability: {           │
│     ├─ days                         ├─ breakTimes           │
│     ├─ start/end                    ├─ minLeadTime          │
│     ├─ breakTimes                   ├─ cancelNotice         │
│     ├─ minLeadTime                  └─ ...                  │
│     ├─ cancelNotice              }                          │
│     └─ appointmentDuration: {                               │
│        ├─ min                                               │
│        └─ max                                               │
│     }                                                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
│
├─ AppointmentBookingPage
│  │
│  ├─ AvailabilityStatusToggle ◄──── Quick status toggle
│  │  │
│  │  └─ Calls: PATCH /appointments/availability
│  │
│  ├─ AvailabilitySettings ◄────── Full settings
│  │  │
│  │  ├─ Status section
│  │  ├─ Working hours
│  │  ├─ Available days
│  │  ├─ Break times manager
│  │  ├─ Lead time inputs
│  │  ├─ Cancel notice inputs
│  │  ├─ Slot configuration
│  │  └─ Custom slots
│  │
│  ├─ Calendar
│  │  │
│  │  └─ Uses: availability.breakTimes
│  │     for slot generation
│  │
│  └─ AvailabilityInfo ◄────────── Display summary
│     │
│     ├─ Status badge
│     ├─ Working hours
│     ├─ Break times list
│     ├─ Lead time message
│     └─ Cancel notice message
│
└─ Other components...
```

---

## Utility Functions Map

```
availabilityUtils.js
│
├─ VALIDATION
│  ├─ isWithinBreakTime(slotStart, slotEnd, breakTimes)
│  │  └─ Returns: boolean
│  │
│  ├─ checkLeadTime(appointmentStart, minLeadHours)
│  │  └─ Returns: boolean
│  │
│  ├─ validateAppointmentDuration(minutes, rules)
│  │  └─ Returns: { isValid, error }
│  │
│  └─ canCancelAppointment(appointmentStart, cancelNotice)
│     └─ Returns: boolean
│
├─ CALCULATION
│  └─ getAvailableSlots(date, availability, appointments)
│     └─ Returns: [{ start, end }]
│
└─ FORMATTING
   ├─ getLeadTimeMessage(minLeadHours)
   │  └─ Returns: "User friendly message"
   │
   └─ getCancelNoticeMessage(cancelNoticeHours)
      └─ Returns: "User friendly message"
```

---

## State Management

```
User Component State
│
├─ availabilityStatus
│  ├─ "available" ───▶ Accept all bookings
│  ├─ "limited"  ───▶ Accept some bookings  
│  └─ "away"     ───▶ Reject all bookings
│
└─ availability
   ├─ days: [1,2,3,4,5]
   ├─ start: "09:00"
   ├─ end: "17:00"
   ├─ breakTimes: [
   │  └─ {start, end}  ◄─── Blocks slots
   │
   ├─ minLeadTime: 2  ◄───── Hours before booking
   ├─ cancelNotice: 24 ◄───── Hours to cancel
   │
   ├─ slotDuration: 30
   ├─ buffer: 15
   ├─ maxPerDay: 5
   │
   └─ appointmentDuration: {
      ├─ min: 15  ◄───── Minimum appointment length
      └─ max: 120 ◄───── Maximum appointment length
```

---

## Request/Response Examples

### Save Availability
```
REQUEST: POST /appointments/availability
{
  "days": [1, 2, 3, 4, 5],
  "start": "09:00",
  "end": "17:00",
  "slotDuration": 30,
  "buffer": 15,
  "maxPerDay": 5,
  "breakTimes": [
    { "start": "12:00", "end": "13:00" },
    { "start": "15:00", "end": "15:30" }
  ],
  "minLeadTime": 2,
  "cancelNotice": 24,
  "appointmentDuration": {
    "min": 15,
    "max": 120
  },
  "availabilityStatus": "available"
}

RESPONSE: 200 OK
{
  "message": "Availability saved successfully",
  "availability": { /* full object */ },
  "availabilityStatus": "available"
}
```

### Get Availability
```
REQUEST: GET /appointments/availability/:userId

RESPONSE: 200 OK
{
  "availability": { /* full object */ },
  "availabilityStatus": "available"
}
```

### Create Appointment (Validation)
```
REQUEST: POST /appointments
{
  "friendId": "user123",
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-15T14:30:00Z",
  "title": "Meeting"
}

RESPONSE: 400 Bad Request (if validation fails)
{
  "message": "Bookings require at least 2 hours advance notice"
}

RESPONSE: 201 Created (if valid)
{
  "appointment": { /* full object */ }
}
```

---

## Error Handling Flow

```
Appointment Creation Request
│
├─ Calculate Duration
│  └─ If < 15 min ──▶ Error: "Duration too short"
│
├─ Check Status
│  └─ If "away" ──▶ Error: "User is away"
│
├─ Check Lead Time
│  └─ If insufficient ──▶ Error: "Need X hours notice"
│
├─ Check Breaks
│  └─ If overlap ──▶ Error: "Overlaps with break time"
│
├─ Check Duration Rules
│  └─ If outside min/max ──▶ Error: "Duration must be X-Y min"
│
└─ ✅ Create Appointment
```

---

## Feature Interdependencies

```
Break Times       Lead Time         Status Toggle
     │                │                   │
     └────┬───────────┼───────────────────┘
          │           │
          ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼
     ┌──────────────────────────────┐
     │  Appointment Creation Flow   │
     │                              │
     │  All 3 features combine to   │
     │  create comprehensive        │
     │  availability control        │
     └──────────────────────────────┘
              │
              ▼
     ┌──────────────────────────────┐
     │   Prevent Double Booking     │
     │   & Enforce Policies         │
     └──────────────────────────────┘
              │
              ▼
     ┌──────────────────────────────┐
     │  Better User Experience      │
     │  More Control For Users      │
     │  Reduced Conflicts           │
     └──────────────────────────────┘
```

---

## Integration Points

```
FRONTEND Integration:
├─ AppointmentBookingPage → Import AvailabilityStatusToggle
├─ Profile/Settings → Import AvailabilitySettings
├─ Appointment Details → Import AvailabilityInfo
└─ Calendar → Use availability.breakTimes

BACKEND Integration:
├─ User.save() → Validates availability fields
├─ Appointment.create() → Uses availabilityUtils
├─ API Routes → POST /appointments/availability
└─ Controllers → Applies all validations

DATABASE Integration:
├─ User schema → New fields added
├─ Appointment schema → New fields added
└─ Existing queries → Still work (backward compatible)
```

---

## Performance Considerations

```
✓ Validation runs on backend (fast, secure)
✓ Utils functions are pure (no side effects)
✓ Break time check is O(n) where n = breakTimes count
✓ Lead time check is O(1) constant time
✓ Duration validation is O(1) constant time
✓ Total validation typically < 10ms

Optimization opportunities:
- Cache availability settings per user
- Index availability timestamps
- Batch validate multiple appointments
```

---

## Backward Compatibility

```
Existing Code → Still Works ✓
├─ Appointments without new fields → Valid
├─ Users without availability → Get defaults
├─ Old API calls → Still accepted
└─ Existing features → Unaffected

Migration Path:
├─ Deploy code (with defaults)
├─ Existing data loads with defaults
├─ Users can configure when ready
└─ No breaking changes
```
