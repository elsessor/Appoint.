const onlineSet = new Set();
const listeners = new Set();
let currentSocket = null;
let presenceInitReceived = false;

export const initPresence = (socket) => {
  if (!socket) return;

  // If this is a new socket, clear online data but keep listeners
  if (currentSocket !== socket) {
    console.log('[Presence] New socket detected, clearing onlineSet but keeping', listeners.size, 'listeners');
    currentSocket = socket;
    onlineSet.clear();
    presenceInitReceived = false;
  }

  // Only register listeners once per socket
  if (socket._presenceInitialized) {
    console.log('[Presence] Socket already has presence listeners initialized');
    return;
  }
  
  socket._presenceInitialized = true;
  console.log('[Presence] Registering presence listeners on new socket');

  // Handle initial list of online users
  socket.on('presence:init', ({ onlineUsers }) => {
    console.log('[Presence] ✓ Received presence:init with', onlineUsers?.length || 0, 'users:', onlineUsers?.map(u => u.userId));
    presenceInitReceived = true;
    if (Array.isArray(onlineUsers)) {
      onlineSet.clear();
      onlineUsers.forEach(({ userId, online }) => {
        if (userId && online) {
          onlineSet.add(userId.toString());
        }
      });
      console.log('[Presence] ✓ onlineSet is now:', Array.from(onlineSet));
      console.log('[Presence] ✓ Notifying', listeners.size, 'listeners of sync');
      // Notify all listeners of the sync
      let notified = 0;
      listeners.forEach((l) => {
        try { 
          notified++;
          l(null, null); 
        } catch (e) { 
          console.error('[Presence] ✗ Listener error during sync:', e); 
        }
      });
      console.log('[Presence] ✓ Notified', notified, 'listeners');
    }
  });

  socket.on('presence:update', ({ userId, online }) => {
    console.log('[Presence] ✓ Received presence:update:', { userId, online });
    if (!userId) return;
    const id = userId.toString();
    const wasOnline = onlineSet.has(id);
    
    if (online) {
      onlineSet.add(id);
    } else {
      onlineSet.delete(id);
    }
    
    console.log(`[Presence] ✓ User ${id}: ${wasOnline} → ${online}, listeners count: ${listeners.size}`);
    
    // Notify listeners if state changed
    if (wasOnline !== online) {
      let notified = 0;
      listeners.forEach((l) => {
        try { 
          notified++;
          l(id, online); 
        } catch (e) { 
          console.error('[Presence] ✗ Listener error during update:', e); 
        }
      });
      console.log(`[Presence] ✓ Notified ${notified} listeners for user ${id}`);
    }
  });
};

export const resetPresence = () => {
  console.log('[Presence] resetPresence - clearing onlineSet, keeping', listeners.size, 'listeners');
  onlineSet.clear();
  presenceInitReceived = false;
  currentSocket = null;
};

export const isOnline = (userId) => {
  if (!userId) return false;
  return onlineSet.has(userId.toString());
};

export const subscribe = (listener) => {
  listeners.add(listener);
  console.log('[Presence] ✓ New subscription, total:', listeners.size, 'onlineSet size:', onlineSet.size);
  
  // Notify immediately if we already have online data
  if (onlineSet.size > 0) {
    console.log('[Presence] ✓ Notifying subscriber immediately (onlineSet has data)');
    try { 
      listener(null, null); 
    } catch (e) { 
      console.error('[Presence] ✗ Error during immediate notification:', e); 
    }
  } else if (presenceInitReceived) {
    console.log('[Presence] ⚠ presenceInitReceived=true but onlineSet is empty - notifying anyway');
    try { 
      listener(null, null); 
    } catch (e) { 
      console.error('[Presence] ✗ Error during sync notification:', e); 
    }
  } else {
    console.log('[Presence] ⏳ Waiting for presence:init event...');
  }
  
  return () => {
    listeners.delete(listener);
    console.log('[Presence] ✓ Unsubscribed, remaining:', listeners.size);
  };
};

export const _getOnlineSet = () => new Set(onlineSet);
