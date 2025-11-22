# Quick Reference - Availability System

## 🎯 Features at a Glance

| Feature | Purpose | Impact |
|---------|---------|--------|
| **Break Times** | Set daily recurring breaks (e.g., lunch 12-1pm) | Prevents bookings during breaks |
| **Lead Time** | Minimum hours before booking allowed (e.g., 2h) | Ensures advance planning |
| **Cancel Notice** | Hours required to cancel (e.g., 24h) | Reduces last-minute cancellations |
| **Quick Toggle** | One-click status: Available/Limited/Away | Easy availability management |

---

## 🚀 Quick Start

### For End Users

**1. Set Your Availability**
```
Settings → Availability Settings
├─ Set working hours (9:00-17:00)
├─ Select available days (Mon-Fri)
├─ Add breaks (12:00-13:00)
├─ Set lead time (2 hours)
├─ Set cancel notice (24 hours)
└─ Click Save
```

**2. Toggle Your Status**
```
Click Status Button → Available/Limited/Away
```

### For Developers

**1. Use Components**
```jsx
// Quick status toggle
<AvailabilityStatusToggle currentUser={user} />

// View availability summary  
<AvailabilityInfo availability={user.availability} />

// Full settings dialog
<AvailabilitySettings isOpen={true} currentUser={user} />
```

**2. Validate Bookings**
```javascript
import { checkLeadTime, isWithinBreakTime } from '../utils/availabilityUtils';

// Check lead time
if (!checkLeadTime(appointmentStart, minLeadHours)) {
  return error("Need more advance notice");
}

// Check breaks
if (isWithinBreakTime(start, end, breakTimes)) {
  return error("Booking during break time");
}
```

---

## 📊 Data Structure

```javascript
// User Availability
{
  availabilityStatus: "available",  // or "limited", "away"
  availability: {
    days: [1, 2, 3, 4, 5],          // 0=Sun, 1=Mon, etc
    start: "09:00",
    end: "17:00",
    slotDuration: 30,               // minutes
    buffer: 15,                     // minutes
    maxPerDay: 5,
    breakTimes: [
      { start: "12:00", end: "13:00" },
      { start: "15:00", end: "15:30" }
    ],
    minLeadTime: 2,                 // hours
    cancelNotice: 24,               // hours
    appointmentDuration: {
      min: 15,                      // minutes
      max: 120                      // minutes
    }
  }
}
```

---

## 🔧 API Reference

### Save Availability
```http
POST /appointments/availability

{
  "days": [1,2,3,4,5],
  "start": "09:00",
  "end": "17:00",
  "breakTimes": [{"start":"12:00","end":"13:00"}],
  "minLeadTime": 2,
  "cancelNotice": 24,
  "availabilityStatus": "available"
}
```

### Get Availability
```http
GET /appointments/availability/:userId

// Response:
{
  "availability": { /* full object */ },
  "availabilityStatus": "available"
}
```

---

## ✅ Validation Rules

### On Appointment Creation

1. **Duration Check**
   - ✓ Must be 15-480 minutes
   - ✓ Must be between min/max duration

2. **Lead Time Check**
   - ✓ Must be minLeadTime hours in future
   - ✗ Error: "Requires X hours notice"

3. **Break Time Check**
   - ✓ Must not overlap with breakTimes
   - ✗ Error: "Overlaps with break time"

4. **Status Check**
   - ✓ If status = "available" or "limited"
   - ✗ If status = "away", reject booking

---

## 📁 Files Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── User.js ✏️ (Updated)
│   │   └── Appointment.js ✏️ (Updated)
│   ├── controllers/
│   │   └── appointments.controller.js ✏️ (Updated)
│   └── utils/
│       └── availabilityUtils.js ✨ (NEW)
│
client/
├── src/
│   └── components/
│       ├── AvailabilitySettings.jsx ✏️ (Enhanced)
│       ├── AvailabilityStatusToggle.jsx ✨ (NEW)
│       └── AvailabilityInfo.jsx ✨ (NEW)
```

---

## 🎨 UI Components

### AvailabilitySettings
Full settings dialog with all options
- Working hours
- Available days
- Break times
- Slot configuration
- Lead time & cancel notice
- Appointment duration rules

### AvailabilityStatusToggle
Quick status dropdown
- 3 status options
- One-click changes
- Preserves all settings
- Toast notifications

### AvailabilityInfo
Display availability summary
- Current status
- Working hours
- Break times
- Lead time
- Cancel notice

---

## 🧪 Testing Scenarios

**Scenario 1: Break Times**
```
Setup: 12:00-13:00 break
Try: Book 12:30
Result: ❌ "Overlaps with break time"
Try: Book 11:00
Result: ✅ Success
```

**Scenario 2: Lead Time**
```
Setup: 2 hour minimum lead time
Try: Book 1 hour from now
Result: ❌ "Requires 2 hours notice"
Try: Book 3 hours from now
Result: ✅ Success
```

**Scenario 3: Status Toggle**
```
Click dropdown → Select "Away"
Try: Book appointment
Result: ❌ "User is away"
Click dropdown → Select "Available"
Try: Book appointment
Result: ✅ Success
```

---

## 💡 Pro Tips

1. **Lead Time = Planning Buffer**
   - 0h: Immediate bookings allowed
   - 2h: Business meetings, enough notice
   - 24h: Professional services, planned ahead

2. **Cancel Notice = Cancellation Policy**
   - 0h: Cancel anytime
   - 24h: "24-hour cancellation policy" 
   - 72h: Strict for services/coaching

3. **Break Times = Recurring Unavailability**
   - Use for daily breaks (lunch, coffee)
   - Not for specific dates (use custom slots)
   - Can have multiple breaks per day

4. **Status Toggle = Quick Control**
   - Away for vacation/busy periods
   - Limited for low availability
   - Available for normal operations

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Break times not working | Check time format (HH:MM 24-hour) |
| Lead time not enforced | Verify minLeadTime > 0 |
| Can't toggle status | Check API connection in network tab |
| Duration validation fails | Check min ≤ duration ≤ max |

---

## 📚 Related Files

- `AVAILABILITY_FEATURES.md` - Full implementation guide
- `IMPLEMENTATION_SUMMARY.md` - What was built
- `backend/src/utils/availabilityUtils.js` - Utility functions
- Database migration files (if needed)

---

## 🔄 Integration Checklist

- [ ] User model deployed with new fields
- [ ] Appointment model updated
- [ ] Backend controllers handle new validations
- [ ] Frontend components imported
- [ ] API endpoints tested
- [ ] Break times enforced
- [ ] Lead time validated
- [ ] Status toggle working
- [ ] Database backup taken
- [ ] Tests passing

---

## 📞 Support

For implementation questions:
1. Check this quick reference
2. Read AVAILABILITY_FEATURES.md
3. Review utility function comments
4. Check browser console for errors
5. Verify database schema matches
