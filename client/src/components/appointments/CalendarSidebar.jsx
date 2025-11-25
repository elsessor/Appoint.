import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

const CalendarSidebar = ({
  friends = [],
  currentUser,
  visibleFriends = [],
  onToggleFriendVisibility,
  selectedDate = null,
  onDateSelect = () => {},
}) => {
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date());
  const [expandMyCalendars, setExpandMyCalendars] = useState(true);

  // Define unique colors for each person
  const colorPalette = [
    { name: 'blue', dot: 'bg-blue-500', light: 'bg-blue-100' },
    { name: 'purple', dot: 'bg-purple-500', light: 'bg-purple-100' },
    { name: 'emerald', dot: 'bg-emerald-500', light: 'bg-emerald-100' },
    { name: 'rose', dot: 'bg-rose-500', light: 'bg-rose-100' },
    { name: 'amber', dot: 'bg-amber-500', light: 'bg-amber-100' },
    { name: 'cyan', dot: 'bg-cyan-500', light: 'bg-cyan-100' },
    { name: 'pink', dot: 'bg-pink-500', light: 'bg-pink-100' },
    { name: 'indigo', dot: 'bg-indigo-500', light: 'bg-indigo-100' },
  ];

  // Get mini calendar days
  const monthStart = startOfMonth(miniCalendarMonth);
  const monthEnd = endOfMonth(miniCalendarMonth);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const miniCalendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Assign colors to each friend
  const friendsWithColors = useMemo(() => {
    const yourColor = {
      _id: currentUser?._id || currentUser?.id,
      name: 'You',
      email: currentUser?.email,
      color: colorPalette[0],
      isCurrentUser: true,
      profilePic: currentUser?.profilePic,
    };

    const friendsList = friends.map((friend, index) => ({
      ...friend,
      color: colorPalette[(index + 1) % colorPalette.length],
      isCurrentUser: false,
    }));

    return [yourColor, ...friendsList];
  }, [friends, currentUser]);

  // Get all visible calendar IDs (always include current user)
  const allVisibleIds = useMemo(() => {
    const currentUserId = currentUser?._id || currentUser?.id;
    return [currentUserId, ...visibleFriends];
  }, [visibleFriends, currentUser]);

  const isVisible = (friendId) => {
    return allVisibleIds.includes(friendId);
  };

  return (
    <div className="w-64 bg-base-100 border-r border-base-300 h-full overflow-y-auto flex flex-col">
      {/* Mini Calendar */}
      <div className="p-3 border-b border-base-300">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setMiniCalendarMonth(subMonths(miniCalendarMonth, 1))}
            className="p-0.5 hover:bg-base-200 rounded"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <h3 className="font-semibold text-base-content text-xs">
            {format(miniCalendarMonth, 'MMM yyyy')}
          </h3>
          <button
            onClick={() => setMiniCalendarMonth(addMonths(miniCalendarMonth, 1))}
            className="p-0.5 hover:bg-base-200 rounded"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-base-content/60 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Mini Calendar Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {miniCalendarDays.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, miniCalendarMonth);
            const isDayToday = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={i}
                onClick={() => onDateSelect(day)}
                className={`text-xs p-0.5 rounded text-center font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-content'
                    : isDayToday
                    ? 'bg-blue-500 text-white'
                    : isCurrentMonth
                    ? 'text-base-content hover:bg-base-200'
                    : 'text-base-content/30 hover:bg-base-200'
                }`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {/* My Calendars Section */}
      <div className="flex-1 p-3 flex flex-col">
        <button
          onClick={() => setExpandMyCalendars(!expandMyCalendars)}
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-base-200 transition-colors mb-2 w-full"
          aria-expanded={expandMyCalendars}
        >
          <span className={`text-lg transition-transform duration-200 ${expandMyCalendars ? 'rotate-180' : ''}`}>↓</span>
          <h3 className="text-xs font-semibold text-base-content">My calendars</h3>
        </button>

        {expandMyCalendars && (
        <div className="space-y-1.5 overflow-y-auto">
          {friendsWithColors.map((friend) => {
            const isCurrentUser = friend.isCurrentUser;
            const visible = isVisible(friend._id);
            const color = friend.color;

            return (
              <div
                key={friend._id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                  visible ? 'bg-base-200' : 'hover:bg-base-200/50'
                }`}
              >
                {/* Color Indicator Checkbox */}
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (!isCurrentUser) {
                        onToggleFriendVisibility(friend._id);
                      }
                    }}
                    disabled={isCurrentUser}
                    className="w-4 h-4 rounded accent-primary cursor-pointer disabled:opacity-100 disabled:cursor-default"
                    style={
                      visible && !isCurrentUser
                        ? { accentColor: color.dot.replace('bg-', '') }
                        : {}
                    }
                  />
                </label>

                {/* Color Dot */}
                <div className={`w-3 h-3 rounded-full ${color.dot} flex-shrink-0`}></div>

                {/* Profile Picture */}
                <img
                  src={friend.profilePic || '/default-profile.svg'}
                  alt={friend.fullName || friend.name}
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    e.target.src = '/default-profile.svg';
                  }}
                />

                {/* Name */}
                <span className="text-xs text-base-content truncate">
                  {friend.name || friend.fullName}
                  {isCurrentUser && <span className="text-xs opacity-60"> (You)</span>}
                </span>
              </div>
            );
          })}
        </div>
        )}

        {expandMyCalendars && friendsWithColors.length === 1 && (
          <div className="px-3 py-4 text-center text-xs text-base-content/50">
            Add friends to see their calendars
          </div>
        )}
      </div>
    </div>
  );
};

CalendarSidebar.propTypes = {
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string,
      fullName: PropTypes.string,
      email: PropTypes.string.isRequired,
      profilePic: PropTypes.string,
    })
  ),
  currentUser: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    fullName: PropTypes.string,
    email: PropTypes.string.isRequired,
    profilePic: PropTypes.string,
  }),
  visibleFriends: PropTypes.arrayOf(PropTypes.string),
  onToggleFriendVisibility: PropTypes.func.isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  onDateSelect: PropTypes.func,
};

CalendarSidebar.defaultProps = {
  friends: [],
  visibleFriends: [],
  onDateSelect: () => {},
};

export default CalendarSidebar;
