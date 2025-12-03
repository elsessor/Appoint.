const onlineSet = new Set();
const listeners = new Set();

export const initPresence = (socket) => {
  if (!socket) return;

  socket.on('presence:update', ({ userId, online }) => {
    if (!userId) return;
    const id = userId.toString();
    const had = onlineSet.has(id);
    if (online) {
      onlineSet.add(id);
    } else {
      onlineSet.delete(id);
    }
    // only notify if state changed
    if (had !== online) {
      listeners.forEach((l) => {
        try { l(id, online); } catch (e) { console.error(e); }
      });
    }
  });
};

export const isOnline = (userId) => {
  if (!userId) return false;
  return onlineSet.has(userId.toString());
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const _getOnlineSet = () => new Set(onlineSet);
