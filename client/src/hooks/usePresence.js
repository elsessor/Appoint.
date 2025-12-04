import { useState, useEffect } from "react";
import { subscribe, isOnline } from "../lib/presence";

const usePresence = (userId) => {
  const userIdStr = userId ? userId.toString() : null;
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!userIdStr) {
      setOnline(false);
      return;
    }

    // Set initial state from onlineSet
    const initialStatus = isOnline(userIdStr);
    setOnline(initialStatus);
    console.log(`[usePresence] ${userIdStr} - subscribed, initial state: ${initialStatus}`);

    // Subscribe to presence changes
    const listener = (changedUserId, changedOnline) => {
      // Sync event: re-check all statuses
      if (changedUserId === null && changedOnline === null) {
        const status = isOnline(userIdStr);
        console.log(`[usePresence] ${userIdStr} - ✓ sync event, new status: ${status}`);
        setOnline(status);
      }
      // Specific update for this user - convert to string for comparison
      else if (changedUserId && changedUserId.toString() === userIdStr) {
        console.log(`[usePresence] ${userIdStr} - ✓ specific update: ${changedOnline}`);
        setOnline(Boolean(changedOnline));
      }
    };

    const unsubscribe = subscribe(listener);

    return unsubscribe;
  }, [userIdStr]);

  return online;
};

export default usePresence;
