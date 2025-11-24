# Quick Start - Using the Features

## 🎯 In 3 Steps

### Step 1: Add Quick Toggle (30 seconds)
```jsx
import AvailabilityStatusToggle from '../components/AvailabilityStatusToggle';

export function YourComponent() {
  return <AvailabilityStatusToggle currentUser={currentUser} />;
}
```
**Result**: Click button → Change Available/Limited/Away → Auto saved ✓

---

### Step 2: Add Full Settings (1 minute)
```jsx
import AvailabilitySettings from '../components/AvailabilitySettings';

export function SettingsPage() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <button onClick={() => setShowSettings(true)}>Settings</button>
      <AvailabilitySettings 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentUser={currentUser}
      />
    </>
  );
}
```
**Result**: Modal opens → Users configure everything → Saves automatically ✓

---

### Step 3: Show Availability Info (1 minute)
```jsx
import AvailabilityInfo from '../components/AvailabilityInfo';

export function FriendProfile({ friend }) {
  return (
    <AvailabilityInfo 
      availability={friend.availability}
      availabilityStatus={friend.availabilityStatus}
    />
  );
}
```
**Result**: Shows friend's availability details ✓

---

## 📋 Use Cases

### Use Case 1: Prevent Bookings During Breaks
```jsx
// Friend sets: Break time 12:00-13:00
// Try to book: 12:30
// Result: ❌ "This time slot overlaps with a break time"
```
✅ Automatically handled by backend validation

---

### Use Case 2: Require Advance Notice
```jsx
// Friend sets: Minimum lead time 2 hours
// Try to book: 1 hour from now
// Result: ❌ "Bookings require at least 2 hours advance notice"

// Try to book: 3 hours from now  
// Result: ✅ Appointment created
```
✅ Automatically handled by backend validation

---

### Use Case 3: Quick Status Toggle
```jsx
// User clicks status button
// Selects "Away"
// Result: ✅ Status changes immediately
// Friends can't book until status changes back

// This saves ALL other settings too
```
✅ One-click with auto-save

---

## 🛠️ Real Examples

### Example 1: Add to Your Navbar
```jsx
import AvailabilityStatusToggle from '../components/AvailabilityStatusToggle';

export function Navbar({ currentUser }) {
  return (
    <nav className="navbar">
      <div className="navbar-center">
        <a href="/">My App</a>
      </div>
      <div className="navbar-end">
        {currentUser && (
          <AvailabilityStatusToggle currentUser={currentUser} />
        )}
      </div>
    </nav>
  );
}
```
Users can change availability status from anywhere!

---

### Example 2: Add to Settings Page
```jsx
import AvailabilitySettings from '../components/AvailabilitySettings';

export function ProfileSettings({ currentUser }) {
  const [showAvailability, setShowAvailability] = useState(false);

  return (
    <div>
      <h1>Settings</h1>
      
      <button 
        onClick={() => setShowAvailability(true)}
        className="btn"
      >
        ⚙️ Manage Availability
      </button>

      <AvailabilitySettings
        isOpen={showAvailability}
        onClose={() => setShowAvailability(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
```
Full control for users to set breaks, lead time, etc.

---

### Example 3: Show Friend's Rules
```jsx
import AvailabilityInfo from '../components/AvailabilityInfo';

export function BookingForm({ selectedFriend }) {
  return (
    <div>
      <h2>Book with {selectedFriend.fullName}</h2>
      
      {/* Show all their rules before booking */}
      <AvailabilityInfo
        availability={selectedFriend.availability}
        availabilityStatus={selectedFriend.availabilityStatus}
      />

      {/* Your booking form below */}
    </div>
  );
}
```
Tells users exactly what the constraints are

---

## ✅ What Gets Validated Automatically

When a friend tries to book with you, these checks happen automatically:

```
1. ✓ Are you away? NO → Continue
2. ✓ Is it 2+ hours from now? YES → Continue  
3. ✓ Is it during lunch break? NO → Continue
4. ✓ Is duration 15-120 min? YES → Continue
5. ✓ BOOKING CREATED!

If any check fails:
❌ Error message shown to user
```

**You don't have to code this** - it's automatic in the backend! ✓

---

## 🎓 Learning Path

### Beginner
1. Import the 3 components
2. Drop them into your pages
3. That's it! ✓

### Intermediate  
1. Learn what each component does
2. Customize styling if needed
3. Handle the callbacks

### Advanced
1. Use utility functions for custom validation
2. Build custom UI on top of the features
3. Integrate with your own backend

---

## 📍 Where to Add Each Component

### AvailabilityStatusToggle
- ✓ Navbar
- ✓ Dashboard header
- ✓ Profile page (top right)
- ✓ Anywhere visible

### AvailabilitySettings
- ✓ Settings page (modal)
- ✓ Profile page (drawer)
- ✓ Account management section
- ✓ Separate admin page

### AvailabilityInfo
- ✓ Friend profile
- ✓ Before booking form
- ✓ Availability calendar
- ✓ Appointment details

---

## 🚀 Copy-Paste Examples

### Copy into Your Navbar
```jsx
{/* In your navbar component */}
<div className="navbar-end gap-2">
  <button className="btn btn-ghost">Profile</button>
  {currentUser && (
    <AvailabilityStatusToggle currentUser={currentUser} />
  )}
</div>
```

### Copy into Your Settings
```jsx
{/* In your settings page */}
<div className="form-control">
  <label className="label">
    <span className="label-text">Availability</span>
  </label>
  <button 
    onClick={() => setShowSettings(true)}
    className="btn btn-outline"
  >
    Manage Hours, Breaks & Rules
  </button>
</div>

<AvailabilitySettings
  isOpen={showSettings}
  onClose={() => setShowSettings(false)}
  currentUser={currentUser}
/>
```

### Copy into Booking Page
```jsx
{/* Before the booking form */}
<div className="card bg-info/10 p-4 mb-4">
  <AvailabilityInfo
    availability={friend.availability}
    availabilityStatus={friend.availabilityStatus}
  />
</div>

{/* Your booking form */}
```

---

## ❓ FAQ

**Q: Do I have to validate on frontend?**
A: No! Backend validates everything automatically. Frontend validation is optional but recommended for better UX.

**Q: Can users change status without opening settings?**
A: Yes! The quick toggle (AvailabilityStatusToggle) is one-click. Settings modal is for detailed config.

**Q: What if user is away? Can they still book?**
A: No. Away status blocks all bookings. Users must change status first.

**Q: Do break times prevent bookings?**
A: Yes. If booked time overlaps with break time, booking fails.

**Q: Can I customize the UI?**
A: Yes. Components use DaisyUI classes. Modify styling as needed.

**Q: What happens if I don't set these?**
A: Default values are used:
- Status: Available
- Lead time: 0 (anytime)
- Cancel notice: 0 (anytime)
- No breaks
- 15-120 min duration

**Q: Is this backward compatible?**
A: Yes. Existing appointments work fine. New features are optional.

---

## 🔗 File Locations

```
Your Project
├─ client/src/components/
│  ├─ AvailabilitySettings.jsx ← Full settings
│  ├─ AvailabilityStatusToggle.jsx ← Quick toggle
│  └─ AvailabilityInfo.jsx ← Display info
│
└─ backend/src/
   ├─ utils/availabilityUtils.js ← Helper functions
   └─ controllers/appointments.controller.js ← Validation
```

---

## 💡 Pro Tips

1. **Add status toggle to navbar** - Easiest, most visible
2. **Add settings to profile** - Where users expect it
3. **Show availability info before booking** - Prevents frustration
4. **Use error messages** - Tell users why booking failed

---

## 🎉 You're Done!

That's it! All features are ready to use. Just:
1. Import the components
2. Add them to your pages
3. Everything else is automatic!

For detailed info, see `AVAILABILITY_FEATURES.md`
