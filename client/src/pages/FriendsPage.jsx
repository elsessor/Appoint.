import { Calendar, CircleChevronRight } from "lucide-react";
import { LANGUAGE_TO_FLAG } from "../constants";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getUserFriends } from "../lib/api";

const LanguageBadge = ({ type, language }) => {
  const langLower = language?.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  return (
    <div className={`inline-flex items-center justify-center gap-2 px-2 py-1 rounded-2xl text-xs font-medium ${
      type === 'native' ? 'bg-[#3ABDF8] text-black' : 'bg-base-300 text-white/80'
    }`}>
      {countryCode && (
        <img
          src={`https://flagcdn.com/24x18/${countryCode}.png`}
          alt={`${langLower} flag`}
          className="h-3.5 w-5 rounded-sm object-cover"
        />
      )}
      <span className="flex items-center">{type === 'native' ? 'Native: ' : 'Learning: '}{language}</span>
    </div>
  );
};

const FriendRow = ({ friend }) => {
  const name = friend.fullName || friend.name || "Unknown";
  const avatar = friend.profilePic || friend.avatar || "/default-profile.svg";
  const native = friend.nativeLanguage || friend.native || "Unknown";
  const learning = friend.learningLanguage || friend.learning || "Unknown";

  return (
    <div key={friend._id || friend.id} className="bg-base-200 rounded-xl p-4">
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img 
              src={avatar} 
              alt={name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/default-profile.svg';
              }}
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <LanguageBadge type="native" language={native} />
                <LanguageBadge type="learning" language={learning} />
              </div>
            </div>
            <div className={`text-xs opacity-60`}>—</div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1">
              <Link
                to={`/chat/${friend._id || friend.id}`}
                className="flex items-center input input-bordered input-sm bg-base-200 text-sm"
              >
                Message
              </Link>
            </div>
            <button className="btn btn-circle btn-sm btn-ghost">
              <Calendar className="w-4 h-4" />
            </button>
            <button className="btn btn-circle btn-sm btn-ghost">
              <CircleChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FriendsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    retry: false,
  });

  const friends = Array.isArray(data) ? data : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-primary mb-6">Friends</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-base-200 rounded-xl p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-base-300" />
                <div className="flex-1">
                  <div className="h-4 bg-base-300 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-base-300 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-sm text-error">Failed to load friends.</div>
      ) : friends.length === 0 ? (
        <div className="text-sm opacity-70">No friends found. Try connecting with users.</div>
      ) : (
        <div className="space-y-4">
          {friends.map((friend) => (
            <FriendRow friend={friend} key={friend._id || friend.id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
