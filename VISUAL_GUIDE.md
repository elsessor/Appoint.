# VISUAL GUIDE - What You'll See in Your App

## 🎯 In Your Navbar (Top Right)

```
┌─────────────────────────────────────────────────────────────┐
│  Appoint.          Bell 🔔   Theme 🌙   [STATUS] Avatar 👤 Logout │
│                                          ↑↑↑                     │
│                                      NEW BUTTON!                 │
└─────────────────────────────────────────────────────────────┘
```

### Status Button Appearance

**When Available:**
```
┌──────────────┐
│ ✓ Available  │  ← Green/Success color
└──────────────┘
```

Click to see dropdown:
```
┌──────────────┐
│ ✓ Available  │  ← Currently selected
├──────────────┤
│ ⚠ Limited    │
├──────────────┤
│ ✕ Away       │
└──────────────┘
```

**When Limited:**
```
┌──────────────┐
│ ⚠ Limited    │  ← Orange/Warning color
└──────────────┘
```

**When Away:**
```
┌──────────────┐
│ ✕ Away       │  ← Red/Error color
└──────────────┘
```

---

## 📄 In Your Profile Page

### Button Row:
```
┌───────────────────────────────────────────────────────────┐
│ [Edit Profile]  [Cancel]        [⚙️ Availability] →      │
│                                                            │
│ (left side)                    (right side - NEW BUTTON)  │
└───────────────────────────────────────────────────────────┘
```

Click "⚙️ Availability" and see:

```
╔═══════════════════════════════════════════════════════════╗
║          ⏰ Availability Settings                         ║
║                                                            ║
║ Availability Status                                        ║
║ [✓ Available]  [⚠ Limited]  [✕ Away]                     ║
║ "Friends can book appointments with you"                  ║
║                                                            ║
║ Working Hours                                              ║
║ Start Time: [09:00]    End Time: [17:00]                 ║
║                                                            ║
║ Available Days                                             ║
║ □Sun  ☑Mon  ☑Tue  ☑Wed  ☑Thu  ☑Fri  □Sat               ║
║                                                            ║
║ Break Times                          [+ Add Break]         ║
║ ┌─────────────────────────────────────────────────┐       ║
║ │ Daily Break                                      │ 🗑     ║
║ │ 12:00 - 13:00                                   │       ║
║ └─────────────────────────────────────────────────┘       ║
║                                                            ║
║ Slot Configuration                                         ║
║ Slot Duration: [30]min  Buffer: [15]min  Max/Day: [5]    ║
║                                                            ║
║ Booking Rules                                              ║
║ Lead Time: [2]h       Cancel Notice: [24]h                ║
║ "Requires 2h notice"  "Cancel with 24h notice"            ║
║                                                            ║
║ Custom Slots (Optional)                   [+ Add Slot]    ║
║ "No custom slots added yet"                               ║
║                                                            ║
║ ℹ️ Settings Overview:                                     ║
║   • Status: Control overall availability                  ║
║   • Break Times: Daily recurring breaks                   ║
║   • Lead Time: Minimum hours before booking               ║
║   • Cancel Notice: Hours required to cancel               ║
║                                                            ║
║ [Cancel]                          [💾 Save Changes]       ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 📅 In Appointments Page (Before Booking)

### Friend Selection + Availability Info:

```
┌─────────────────────────────────────────────────────────────┐
│ FRIENDS                  │  BOOKING DETAILS                 │
│ ┌─────────────────┐      │  John Doe                        │
│ │ John Doe        │      │  ┌──────────────────────────┐   │
│ │ (selected)      │      │  │ ✓ AVAILABLE              │   │
│ ├─────────────────┤      │  │                          │   │
│ │ Jane Smith      │      │  │ ⏰ 09:00 - 17:00        │   │
│ ├─────────────────┤      │  │                          │   │
│ │ Mike Johnson    │      │  │ ☕ Break Times:         │   │
│ └─────────────────┘      │  │   12:00 - 13:00         │   │
│                          │  │   15:00 - 15:30         │   │
│                          │  │                          │   │
│                          │  │ ⏳ 2h advance notice    │   │
│                          │  │ 📋 24h notice to cancel │   │
│                          │  └──────────────────────────┘   │
│                          │                                  │
│                          │ Select Time:                     │
│                          │ [2024-11-22 at 14:00]           │
│                          │                                  │
│                          │ [Book Appointment]               │
└─────────────────────────────────────────────────────────────┘
```

### If Friend is Away:

```
┌──────────────────────────────┐
│ Jane Smith                   │
│ ┌────────────────────────────┐│
│ │ ✕ AWAY                     ││
│ │                            ││
│ │ "This user is currently    ││
│ │  away and not accepting    ││
│ │  bookings"                 ││
│ └────────────────────────────┘│
└──────────────────────────────┘
```

---

## 🔔 Notifications/Toast Messages

### After Setting Status:
```
┌─────────────────────────┐
│ ✓ Status changed to Away│
└─────────────────────────┘
(appears 3 seconds, auto-disappears)
```

### After Saving Availability:
```
┌──────────────────────────────────┐
│ ✓ Availability saved successfully│
│   Modal closes automatically      │
└──────────────────────────────────┘
```

### When Booking Fails (Lead Time):
```
┌────────────────────────────────────────────┐
│ ❌ Bookings require at least 2 hours      │
│    advance notice                         │
└────────────────────────────────────────────┘
```

### When Booking Fails (Break Time):
```
┌─────────────────────────────────────────────┐
│ ❌ This time slot overlaps with a break time │
└─────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

| Component | Color | Usage |
|-----------|-------|-------|
| Available | Green (#10b981) | When status is available |
| Limited | Orange (#f59e0b) | When status is limited |
| Away | Red (#ef4444) | When status is away |
| Primary | Blue (#3b82f6) | Buttons, links, primary actions |
| Secondary | Teal (#14b8a6) | Settings button, secondary actions |
| Success | Green (#10b981) | Success messages |
| Warning | Orange (#f59e0b) | Warnings, breaks |
| Error | Red (#ef4444) | Errors, away status |

---

## 📱 Mobile View

### Navbar (smaller screens):
```
┌────────────────────────────────────┐
│ Logo  [🔔] [🌙] [STATUS] [👤] [⬅️] │
│                    ↑↑↑              │
│                STATUS BUTTON        │
└────────────────────────────────────┘
```

### Profile Page:
```
┌────────────────────┐
│ [Profile Picture]  │
│ Your Name ✓        │
│ Location           │
│                    │
│ [Edit Profile]     │
│ [⚙️ Availability]  │
│                    │
│ Contact Info       │
│ ...                │
└────────────────────┘
```

### Availability Modal (Mobile):
Scrolls vertically, same content, adapts to screen size.

---

## 🔄 Workflow Examples

### Example 1: Quickly Go Away
```
1. Click status button (navbar)
2. See dropdown
3. Click "Away"
4. ✅ Status changes
5. Friends see you're away
```

### Example 2: Set Lunch Break
```
1. Go to Profile
2. Click "⚙️ Availability"
3. Scroll to "Break Times"
4. Click "+ Add Break"
5. Enter: 12:00 - 13:00
6. Click "Save Changes"
7. ✅ Lunch break set
8. No bookings during 12:00-13:00
```

### Example 3: Require 24 Hour Notice
```
1. Profile → "⚙️ Availability"
2. Find "Booking Rules"
3. Set "Lead Time" to 24
4. Click "Save Changes"
5. ✅ Friends must book 24h+ in advance
```

### Example 4: Book with Friend
```
1. Go to Appointments
2. Click friend name
3. Check their availability card
4. See requirements
5. Select valid time
6. Click "Book Appointment"
7. ✅ Booked!
```

---

## 📊 State Transitions

### Status Button States:
```
Available → Click → Show dropdown
            ├─ Select Available → Status: Available ✓
            ├─ Select Limited → Status: Limited ✓
            └─ Select Away → Status: Away ✓
```

### Settings Modal States:
```
Button clicked → Modal opens (loading state)
                ↓
             Modal loads with current settings
                ↓
             User makes changes
                ↓
             Click "Save Changes"
                ↓
             Show "Saving..." spinner
                ↓
             Success → Modal closes
             Error → Show error message
```

---

## ✨ Interactive Elements

### Buttons You Can Click:
- ✓ Status dropdown button (navbar)
- ✓ "⚙️ Availability" button (profile)
- ✓ Status options inside dropdown
- ✓ Break time "Add Break" button
- ✓ Break time remove (trash icon)
- ✓ Custom slots add/remove
- ✓ "Save Changes" button
- ✓ "Cancel" button (close modal)
- ✓ Day checkboxes
- ✓ Input fields

### Inputs You Can Change:
- ✓ Start/end time (time inputs)
- ✓ Available days (checkboxes)
- ✓ Break times (time inputs)
- ✓ Lead time hours (number input)
- ✓ Cancel notice hours (number input)
- ✓ Slot duration (number input)
- ✓ Buffer time (number input)

---

## 🎯 First Time Setup Example

When you first log in:

```
1. Navbar loads
   └─ Status button appears (default: Available)

2. Go to Profile
   └─ See "⚙️ Availability" button

3. Click it
   └─ Modal opens with defaults:
      - Available
      - 9:00-17:00
      - Mon-Fri
      - No breaks
      - No lead time
      - No cancel notice

4. Make changes (e.g., add lunch break)
5. Save
6. ✅ Ready to go!

Now when friends book:
- They'll see your status
- They'll see break times
- System enforces rules
- Everyone's happy!
```

---

That's what you'll see! Everything is integrated and ready to use. 🎉
