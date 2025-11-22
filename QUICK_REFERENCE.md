# Quick Reference Guide - Enhanced Appointment Booking

## 🎯 At a Glance

| Feature | Before | After |
|---------|--------|-------|
| **Modal Size** | Small centered | Large sliding from right |
| **Duration** | Manual end time entry | Auto-calculated from dropdown |
| **Cancellation** | Simple delete | Multi-step with reason selection |
| **Requests** | Basic modal | Full featured request manager |
| **Decline** | Not available | With required message |
| **Time Constraints** | None | Prevents past scheduling |

---

## 🔑 Key Components

### AppointmentModal
**Location**: `src/components/appointments/AppointmentModal.jsx`

**Props**:
```javascript
{
  isOpen: boolean,                    // Show/hide modal
  onClose: function,                  // Close handler
  onSubmit: function,                 // Create/update handler
  onDelete: function,                 // Cancel handler (with reason)
  onAccept: function,                 // Accept handler (future use)
  onDecline: function,                // Decline handler (future use)
  initialDate: Date,                  // Pre-fill date
  initialTime: Date,                  // Pre-fill time
  friends: array,                     // Friend list for dropdown
  currentUser: object,                // Current user data
  appointment: object,                // Edit existing appointment
  availability: {                     // Business hours
    days: [1,2,3,4,5],              // Mon-Fri
    start: '09:00',                  // Business start
    end: '17:00'                     // Business end
  }
}
```

**States**:
- `formData`: Appointment form data
- `showCancellation`: Toggle cancellation form
- `cancellationReason`: Selected reason
- `customReason`: Custom cancellation text
- `showDeclineForm`: Toggle decline form
- `declineMessage`: Decline message text

---

### AppointmentRequestModal
**Location**: `src/components/appointments/AppointmentRequestModal.jsx`

**Props**:
```javascript
{
  isOpen: boolean,                    // Show/hide modal
  onClose: function,                  // Close handler
  onAccept: function(appointmentId),  // Accept handler
  onDecline: function(appointmentId, message), // Decline handler
  appointment: object,                // Request data
  currentUser: object,                // Current user
  isLoading: boolean                  // Loading state
}
```

**States**:
- `showDeclineForm`: Toggle decline form
- `declineMessage`: User's decline message

---

## 🛠️ How to Use

### Import Components
```javascript
import AppointmentModal from '../components/appointments/AppointmentModal';
import AppointmentRequestModal from '../components/appointments/AppointmentRequestModal';
```

### Create Appointment
```javascript
const [showCreateModal, setShowCreateModal] = useState(false);

<AppointmentModal
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onSubmit={(data) => {
    // Send to API
    createAppointmentMutation.mutate(data);
  }}
  friends={friends}
  currentUser={currentUser}
  availability={availability}
/>
```

### Handle Request
```javascript
const [selectedRequest, setSelectedRequest] = useState(null);

<AppointmentRequestModal
  isOpen={!!selectedRequest}
  onClose={() => setSelectedRequest(null)}
  appointment={selectedRequest}
  onAccept={(id) => acceptMutation.mutate(id)}
  onDecline={(id, message) => declineMutation.mutate({id, message})}
/>
```

---

## 📋 Status Flow

```
User Creates Appointment
        ↓
   SCHEDULED
        ↓
  Friend Receives Request
        ↓
    PENDING  ← Friend makes decision
    ↙     ↘
CONFIRMED  DECLINED
    ↓        ↓
(Both show reason/message if needed)
    ↓
 Can be CANCELLED with reason
```

---

## ⏰ Duration Options

```javascript
const durationOptions = [15, 30, 45, 60, 90, 120]; // minutes
```

### Auto-calculation Example
```
Start: 2:00 PM
Duration: 30 minutes
End: Auto-calculated to 2:30 PM
```

---

## ⛔ Time Constraints

### Past Date/Time Prevention
```javascript
const startDateTime = parseISO(formData.startTime);
const now = new Date();

if (isBefore(startDateTime, now)) {
  alert('Cannot schedule an appointment in the past');
  return;
}
```

### Today's Time Slots
```javascript
const isSelectedToday = isToday(selectedDate);

if (isSelectedToday && isBefore(current, now)) {
  slots.push({ time: slotTime, disabled: true });
}
```

---

## 🔐 Cancellation Reasons

### Predefined List
```javascript
const CANCELLATION_REASONS = [
  'Schedule Conflict',
  'Unexpected Emergency',
  'Weather Issues',
  'Technical Difficulties',
  'Personal Reasons',
  'Other (Please specify)',
];
```

### Custom Reason
When "Other" selected, textarea appears for custom explanation.

---

## 📊 API Integration Points

### Create Appointment
```javascript
POST /appointments
{
  title: string,
  startTime: ISO string,
  endTime: ISO string,
  duration: number,
  friendId: string,
  meetingType: string,
  description: string,
  status: 'scheduled'
}
```

### Accept Appointment
```javascript
PUT /appointments/:id
{ status: 'confirmed' }
```

### Decline Appointment
```javascript
PUT /appointments/:id
{
  status: 'declined',
  declinedReason: string
}
```

### Cancel Appointment
```javascript
DELETE /appointments/:id
{ cancellationReason: string }
```

---

## 🎨 Styling Classes

### Modal Colors
- **Blue**: Request header `from-blue-700 to-blue-600`
- **Gray**: Edit header `from-gray-800 to-gray-700`
- **Red**: Cancellation alert `bg-red-900 bg-opacity-30`
- **Yellow**: Decline alert `bg-yellow-900 bg-opacity-30`

### Status Badges
```javascript
const statusColors = {
  pending: 'bg-yellow-900 text-yellow-200',
  confirmed: 'bg-green-900 text-green-200',
  scheduled: 'bg-blue-900 text-blue-200',
  declined: 'bg-red-900 text-red-200',
  cancelled: 'bg-gray-700 text-gray-200',
};
```

---

## 🚀 Common Operations

### Show Create Modal
```javascript
<button onClick={() => setShowCreateModal(true)}>
  New Appointment
</button>
```

### Click Pending Request
```javascript
const handleRequestClick = (appointment) => {
  if (appointment.status === 'pending') {
    setSelectedRequest(appointment);
    setShowRequestModal(true);
  }
};
```

### Show Pending Alert
```javascript
{appointments.some(apt => apt.status === 'pending') && (
  <div className="bg-yellow-900 border border-yellow-700 p-4">
    You have pending appointment requests
  </div>
)}
```

---

## ⚠️ Validation Rules

| Field | Rule | Error Message |
|-------|------|---|
| Title | Required, non-empty | "Please enter an appointment title" |
| Friend | Required selection | "Please select a friend" |
| Start Date | Cannot be past | "Cannot schedule in the past" |
| Start Time | Cannot be past | "Cannot schedule in the past" |
| Decline Message | Required if declining | "Please provide a reason for declining" |
| Cancel Reason | Required if cancelling | "Please select a cancellation reason" |

---

## 📱 Responsive Breakpoints

- **Mobile**: `max-w-2xl` width adapts to screen
- **Tablet**: Full height modal visible
- **Desktop**: Max width enforced, centered on larger screens

---

## 🔄 Mutation Integration

```javascript
// Query client invalidation
queryClient.invalidateQueries(['appointments']);
queryClient.refetchQueries(['appointments']);

// Toast notifications
toast.success('Appointment created successfully!');
toast.error('Failed to create appointment');
```

---

## 💾 Local State Reset

After successful mutation:
```javascript
setFormData({
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  friendId: '',
  meetingType: 'Video Call',
  duration: 30,
});
setShowCancellation(false);
setCancellationReason('');
setCustomReason('');
```

---

## 🧪 Testing Examples

### Test Past Date Prevention
```javascript
const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 1); // Yesterday
// Try to create appointment
// Expected: Alert "Cannot schedule in the past"
```

### Test Duration Auto-calculation
```javascript
// Set start: 2:00 PM
// Set duration: 60 minutes
// Expected end: Auto-filled with 3:00 PM
```

### Test Decline Message Required
```javascript
// Click Decline
// Try to submit with empty message
// Expected: Alert "Please provide a reason"
```

---

## 📞 Support

For issues or questions:
1. Check `APPOINTMENT_BOOKING_FEATURES.md` for detailed docs
2. Review `IMPLEMENTATION_SUMMARY.md` for architecture
3. Check error messages in console
4. Verify API endpoints are correct

---

**Last Updated**: November 21, 2025
**Version**: 2.0 (Enhanced)

