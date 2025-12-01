import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests, markNotificationsRead, getNotifications, markNotificationAsRead } from "../lib/api";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon, CalendarIcon } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";
import { format } from "date-fns";

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: friendRequests, isLoading: isLoadingFriendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const { mutate: markAsReadMutation } = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  // Filter appointment notifications from the notifications array
  const appointmentNotifications = useMemo(() => {
    return notifications.filter((notification) => notification.type === 'appointment' || notification.type === 'rating');
  }, [notifications]);

  const { mutate: markAsRead } = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const hasUnread = useMemo(() => {
    return (
      incomingRequests.some((req) => !req.recipientSeen) ||
      acceptedRequests.some((req) => !req.senderSeen)
    );
  }, [incomingRequests, acceptedRequests]);

  useEffect(() => {
    if (!isLoadingFriendRequests && (incomingRequests.length > 0 || acceptedRequests.length > 0) && hasUnread) {
      markAsRead();
    }
  }, [acceptedRequests.length, hasUnread, incomingRequests.length, isLoadingFriendRequests, markAsRead]);

  // Filter logic based on active filter
  const filteredAppointments = useMemo(() => {
    if (activeFilter === "all") return appointmentNotifications;
    if (activeFilter === "unread") return appointmentNotifications.filter(n => !n.isRead);
    if (activeFilter === "appointments") return appointmentNotifications;
    return [];
  }, [appointmentNotifications, activeFilter]);

  const filteredFriendRequests = useMemo(() => {
    if (activeFilter === "all" || activeFilter === "friends") return incomingRequests;
    if (activeFilter === "unread") return incomingRequests.filter(req => !req.recipientSeen);
    return [];
  }, [incomingRequests, activeFilter]);

  const filteredNewConnections = useMemo(() => {
    if (activeFilter === "all" || activeFilter === "friends") return acceptedRequests;
    if (activeFilter === "unread") return acceptedRequests.filter(req => !req.senderSeen);
    return [];
  }, [acceptedRequests, activeFilter]);

  // Count unread for each category
  const unreadCounts = useMemo(() => {
    return {
      all: appointmentNotifications.filter(n => !n.isRead).length + 
            incomingRequests.filter(r => !r.recipientSeen).length +
            acceptedRequests.filter(r => !r.senderSeen).length,
      appointments: appointmentNotifications.filter(n => !n.isRead).length,
      friends: incomingRequests.filter(r => !r.recipientSeen).length + 
               acceptedRequests.filter(r => !r.senderSeen).length,
    };
  }, [appointmentNotifications, incomingRequests, acceptedRequests]);

  const hasNoNotifications = 
    filteredAppointments.length === 0 && 
    filteredFriendRequests.length === 0 && 
    filteredNewConnections.length === 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-base-100 min-h-full">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Notifications</h1>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveFilter("all")}
            className={`btn btn-sm ${activeFilter === "all" ? "btn-primary" : "btn-ghost"}`}
          >
            All
            {unreadCounts.all > 0 && (
              <span className="badge badge-sm ml-1">{unreadCounts.all}</span>
            )}
          </button>
          
          <button
            onClick={() => setActiveFilter("unread")}
            className={`btn btn-sm ${activeFilter === "unread" ? "btn-primary" : "btn-ghost"}`}
          >
            Unread
            {unreadCounts.all > 0 && (
              <span className="badge badge-sm ml-1">{unreadCounts.all}</span>
            )}
          </button>
          
          <button
            onClick={() => setActiveFilter("appointments")}
            className={`btn btn-sm ${activeFilter === "appointments" ? "btn-primary" : "btn-ghost"}`}
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Appointments
            {unreadCounts.appointments > 0 && (
              <span className="badge badge-sm ml-1">{unreadCounts.appointments}</span>
            )}
          </button>
          
          <button
            onClick={() => setActiveFilter("friends")}
            className={`btn btn-sm ${activeFilter === "friends" ? "btn-primary" : "btn-ghost"}`}
          >
            <UserCheckIcon className="h-4 w-4 mr-1" />
            Friends
            {unreadCounts.friends > 0 && (
              <span className="badge badge-sm ml-1">{unreadCounts.friends}</span>
            )}
          </button>
        </div>

        {(isLoadingFriendRequests || isLoadingNotifications) ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {filteredAppointments.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Appointment Notifications
                  <span className="badge badge-primary ml-2">{filteredAppointments.length}</span>
                </h2>

                <div className="space-y-3">
                  {filteredAppointments.map((notification) => (
                    <div
                      key={notification._id}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsReadMutation(notification._id);
                        }
                      }}
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar mt-1 size-10 rounded-full">
                            <img
                              src={(notification.senderId?.profilePic?.trim()) ? notification.senderId.profilePic : '/default-profile.svg'}
                              alt={notification.senderId?.fullName || 'User'}
                              onError={(e) => {
                                e.target.src = '/default-profile.svg';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{notification.title}</h3>
                            <p className="text-sm my-1">{notification.message}</p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="badge badge-primary">New</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {filteredFriendRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">{filteredFriendRequests.length}</span>
                </h2>

                <div className="space-y-3">
                  {filteredFriendRequests.map((request) => (
                    <div
                      key={request._id}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="avatar w-14 h-14 rounded-full bg-base-300">
                              <img 
                                src={(request.sender.profilePic?.trim()) ? request.sender.profilePic : '/default-profile.svg'} 
                                alt={request.sender.fullName}
                                onError={(e) => {
                                  e.target.src = '/default-profile.svg';
                                }}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold">{request.sender.fullName}</h3>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="badge badge-secondary badge-sm">
                                  Native: {request.sender.nativeLanguage}
                                </span>
                                <span className="badge badge-outline badge-sm">
                                  Learning: {request.sender.learningLanguage}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptRequestMutation(request._id)}
                            disabled={isPending}
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {filteredNewConnections.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {filteredNewConnections.map((notification) => (
                    <div key={notification._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar mt-1 size-10 rounded-full">
                            <img
                              src={(notification.recipient?.profilePic?.trim()) ? notification.recipient.profilePic : '/default-profile.svg'}
                              alt={notification.recipient?.fullName}
                              onError={(e) => {
                                e.target.src = '/default-profile.svg';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{notification.recipient.fullName}</h3>
                            <p className="text-sm my-1">
                              {notification.recipient.fullName} accepted your friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Recently
                            </p>
                          </div>
                          <div className="badge badge-success">
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            New Friend
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {hasNoNotifications && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;
