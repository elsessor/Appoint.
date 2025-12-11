import { useState, useEffect } from "react";
import { subscribe, isOnline } from "../lib/presence";

const useMultiplePresence = (userIds = []) => {
  const [onlineStatuses, setOnlineStatuses] = useState(new Map());

  useEffect(() => {
    if (!userIds || userIds.length === 0) return;

    // Initialize with current online status
    const initialStatuses = new Map();
    userIds.forEach(id => {
      if (id) {
        initialStatuses.set(id.toString(), isOnline(id));
      }
    });
    setOnlineStatuses(initialStatuses);

    // Subscribe to presence updates
    const listener = (changedUserId, changedOnline) => {
      // Handle sync events
      if (changedUserId === null && changedOnline === null) {
        const updated = new Map();
        userIds.forEach(id => {
          if (id) {
            updated.set(id.toString(), isOnline(id));
          }
        });
        setOnlineStatuses(updated);
      }
      // Handle specific user updates
      else if (changedUserId) {
        const id = changedUserId.toString();
        if (initialStatuses.has(id) || userIds.some(uid => uid?.toString() === id)) {
          setOnlineStatuses(prev => new Map(prev).set(id, changedOnline));
        }
      }
    };

    const unsubscribe = subscribe(listener);
    return unsubscribe;
  }, [userIds.length]); // Only depend on array length for stability

  return onlineStatuses;
};

export default useMultiplePresence;
