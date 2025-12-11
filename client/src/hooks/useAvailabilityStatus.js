import { useState, useEffect } from "react";
import { subscribe, getAvailabilityStatus } from "../lib/presence";

const useAvailabilityStatus = (userId) => {
  const userIdStr = userId ? userId.toString() : null;
  const [availabilityStatus, setAvailabilityStatus] = useState(null);

  useEffect(() => {
    if (!userIdStr) {
      setAvailabilityStatus(null);
      return;
    }

    // Set initial status from availabilityStatusMap
    const initialStatus = getAvailabilityStatus(userIdStr);
    setAvailabilityStatus(initialStatus || null);
    console.log(`[useAvailabilityStatus] ${userIdStr} - subscribed, initial status: ${initialStatus}`);

    // Subscribe to presence changes (which now include availability updates)
    const listener = (eventType, changedUserId) => {
      // Availability changed event
      if (eventType === 'availability' && changedUserId === userIdStr) {
        const status = getAvailabilityStatus(userIdStr);
        console.log(`[useAvailabilityStatus] ${userIdStr} - ✓ availability update: ${status}`);
        setAvailabilityStatus(status || null);
      }
      // Sync event: re-check all statuses
      else if (eventType === null && changedUserId === null) {
        const status = getAvailabilityStatus(userIdStr);
        console.log(`[useAvailabilityStatus] ${userIdStr} - ✓ sync event, new status: ${status}`);
        setAvailabilityStatus(status || null);
      }
    };

    const unsubscribe = subscribe(listener);

    return unsubscribe;
  }, [userIdStr]);

  return availabilityStatus;
};

export default useAvailabilityStatus;
