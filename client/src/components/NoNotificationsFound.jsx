import { BellIcon } from "lucide-react";

const NoNotificationsFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">
        <BellIcon className="h-16 w-16 text-base-content/30" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
      <p className="text-base-content/70 max-w-sm">
        You're all caught up! New friend requests and connections will appear here.
      </p>
    </div>
  );
};

export default NoNotificationsFound;
