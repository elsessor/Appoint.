import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests, markNotificationsRead, getNotifications, markNotificationAsRead, deleteNotification, getAuthUser } from "../lib/api";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon, CalendarIcon, TrashIcon } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";
import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { getStatusColor, formatStatusLabel } from "../utils/statusColors";

const AllCaughtUpState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative">
        <CheckCircle2 className="h-24 w-24 text-success animate-bounce" />
        <div className="absolute -top-2 -right-2">
        </div>
      </div>
      <h3 className="text-2xl font-bold mt-6 mb-2">You're All Caught Up!</h3>
      <p className="text-base-content/70 text-center max-w-md">
        No unread notifications. You're on top of everything!
      </p>
      <div className="mt-6 flex gap-2">
        <div className="badge badge-success gap-2">
          <CheckCircle2 className="h-3 w-3" />
          Inbox Zero
        </div>
      </div>
    </div>
  );
};

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: currentUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: getAuthUser,
  });

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

  const { mutate: deleteNotificationMutation } = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

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

  // ====== NEW: Combine all notifications into one chronologically sorted feed ======
  const allNotificationsFeed = useMemo(() => {
    const combined = [];
    
    // Add appointment notifications
    filteredAppointments.forEach(notif => {
      combined.push({
        ...notif,
        notifType: 'appointment',
        dateForSort: new Date(notif.createdAt)
      });
    });
    
    // Add friend requests
    filteredFriendRequests.forEach(req => {
      combined.push({
        ...req,
        notifType: 'friendRequest',
        dateForSort: new Date(req.createdAt || req.updatedAt)
      });
    });
    
    // Add new connections
    filteredNewConnections.forEach(conn => {
      combined.push({
        ...conn,
        notifType: 'newConnection',
        dateForSort: new Date(conn.updatedAt || conn.createdAt)
      });
    });
    
    // Sort by date - newest first
    return combined.sort((a, b) => b.dateForSort - a.dateForSort);
  }, [filteredAppointments, filteredFriendRequests, filteredNewConnections]);

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

  return (
    <div className="min-h-screen bg-base-100 pt-2 lg:pt-16 pb-16 lg:pb-8 px-2 sm:px-4">
      <div className="w-full max-w-full lg:max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-6">Notifications</h1>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveFilter("all")}
            className={`btn btn-xs sm:btn-sm ${activeFilter === "all" ? "btn-primary" : "btn-ghost"}`}
          >
            All
            {unreadCounts.all > 0 && (
              <span className="badge badge-xs sm:badge-sm ml-1">{unreadCounts.all}</span>
            )}
          </button>
          
          <button
            onClick={() => setActiveFilter("unread")}
            className={`btn btn-xs sm:btn-sm ${activeFilter === "unread" ? "btn-primary" : "btn-ghost"}`}
          >
            Unread
            {unreadCounts.all > 0 && (
              <span className="badge badge-xs sm:badge-sm ml-1">{unreadCounts.all}</span>
            )}
          </button>
          
          <button
            onClick={() => setActiveFilter("appointments")}
            className={`btn btn-xs sm:btn-sm ${activeFilter === "appointments" ? "btn-primary" : "btn-ghost"}`}
          >
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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
          <div className="space-y-3">
            {allNotificationsFeed.length === 0 ? (
              activeFilter === "unread" ? (
                <AllCaughtUpState />
              ) : (
                <NoNotificationsFound />
              )
            ) : (
              allNotificationsFeed.map((item) => {
                // Render based on notification type
                if (item.notifType === 'appointment') {
                  const notification = item;
                  
                  // Extract status from title
                  const getStatusFromTitle = (title) => {
                    if (title.includes('Confirmed')) return 'confirmed';
                    if (title.includes('Declined') || title.includes('Rejected')) return 'declined';
                    if (title.includes('Cancelled')) return 'cancelled';
                    if (title.includes('Request')) return 'pending';
                    if (title.includes('Rescheduled')) return 'rescheduled';
                    if (title.includes('Completed')) return 'completed';
                    return null;
                  };

                  const status = getStatusFromTitle(notification.title);

                  return (
                    <div
                      key={notification._id}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div 
                            className="avatar mt-1 size-10 rounded-full cursor-pointer flex-shrink-0"
                            onClick={() => {
  if (!notification.isRead) {
    markAsReadMutation(notification._id);
  }
  // Navigate to appointments page with incoming filter
  navigate('/appointments?filter=incoming');
}}
                          >
                            <img
                              src={(notification.senderId?.profilePic?.trim()) ? notification.senderId.profilePic : '/default-profile.svg'}
                              alt={notification.senderId?.fullName || 'User'}
                              onError={(e) => {
                                e.target.src = '/default-profile.svg';
                              }}
                            />
                          </div>
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={async () => {
                              if (!notification.isRead) {
                                markAsReadMutation(notification._id);
                              }
                              setTimeout(() => {
                                navigate('/appointments');
                              }, 300);
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{notification.title}</h3>
                              {status && (
                                <span className={`badge badge-sm ${getStatusColor(status)}`}>
                                  {formatStatusLabel(status)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm my-1">{notification.message}</p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 self-center">
                            {!notification.isRead && (
                              <div className="badge badge-primary">New</div>
                            )}
                            <button
                              className="btn btn-ghost btn-sm p-2 text-error hover:bg-error/10 hover:scale-110 transition-all group relative"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to delete this notification?")) {
                                  deleteNotificationMutation(notification._id);
                                }
                              }}
                              aria-label="Delete notification"
                            >
                              <TrashIcon className="h-5 w-5" />
                              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-base-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Delete
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } 
                
                else if (item.notifType === 'friendRequest') {
                  const request = item;
                  return (
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
                              <p className="text-sm text-base-content/60">Sent you a friend request</p>
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
                  );
                } 
                
                else if (item.notifType === 'newConnection') {
                  const notification = item;
                  return (
                    <div key={notification._id} className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div 
                            className="avatar mt-1 size-10 rounded-full flex-shrink-0 cursor-pointer"
                            onClick={() => navigate(`/profile/${notification.recipient._id}`)}
                          >
                            <img
                              src={(notification.recipient?.profilePic?.trim()) ? notification.recipient.profilePic : '/default-profile.svg'}
                              alt={notification.recipient?.fullName}
                              onError={(e) => {
                                e.target.src = '/default-profile.svg';
                              }}
                            />
                          </div>
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => navigate(`/profile/${notification.recipient._id}`)}
                          >
                            <h3 className="font-semibold">{notification.recipient.fullName}</h3>
                            <p className="text-sm my-1">
                              Accepted your friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {notification.updatedAt 
                                ? format(new Date(notification.updatedAt), "MMM d, yyyy 'at' h:mm a")
                                : 'Recently'
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-2 self-center">
                            <div className="badge badge-success gap-1">
                              <UserCheckIcon className="h-3 w-3" />
                              New Friend
                            </div>
                            <button
                              className="btn btn-ghost btn-sm p-2 hover:bg-primary/10 hover:scale-110 transition-all group relative"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/chats/${notification.recipient._id}`);
                              }}
                              aria-label="Message friend"
                            >
                              <MessageSquareIcon className="h-5 w-5" />
                              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-base-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Message
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;