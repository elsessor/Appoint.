import { Calendar, CircleChevronRight } from "lucide-react";
import { LANGUAGE_TO_FLAG } from "../constants";

const MOCK_FRIENDS = [
  {
    id: 1,
    name: "Bon Hernandez",
    avatar: "/bon.jpg",
    nativeLanguage: "Japanese",
    learningLanguage: "Korean",
    lastSeen: "Online",
    isOnline: true
  },
  {
    id: 2,
    name: "Larry Agad",
    avatar: "/larry.jpg",
    nativeLanguage: "Bisaya",
    learningLanguage: "Hindi",
    lastSeen: "13 mins ago",
    isOnline: false
  },
  {
    id: 3,
    name: "Joshua Garcia",
    avatar: "/mick.jpg",
    nativeLanguage: "Japanese",
    learningLanguage: "Korean",
    lastSeen: "3 Days ago",
    isOnline: false
  },
  {
    id: 4,
    name: "Chamber",
    avatar: "/chamber.jpg",
    nativeLanguage: "Japanese",
    learningLanguage: "Korean",
    lastSeen: "Online",
    isOnline: true
  },
  {
    id: 5,
    name: "Taro Sakamoto",
    avatar: "/ling.jpg",
    nativeLanguage: "Japanese",
    learningLanguage: "Korean",
    lastSeen: "09/21/25",
    isOnline: false
  },
  {
    id: 6,
    name: "Sung Jinwoo",
    avatar: "/sungjinwoo.jpg",
    nativeLanguage: "Japanese",
    learningLanguage: "Korean",
    lastSeen: "Online",
    isOnline: true
  }
];

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

const FriendsPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-primary mb-6">Friends</h1>

      <div className="space-y-4">
        {MOCK_FRIENDS.map((friend) => (
          <div key={friend.id} className="bg-base-200 rounded-xl p-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {friend.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-base-200" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{friend.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <LanguageBadge type="native" language={friend.nativeLanguage} />
                      <LanguageBadge type="learning" language={friend.learningLanguage} />
                    </div>
                  </div>
                  <div className={`text-xs ${friend.isOnline ? 'text-success' : 'opacity-60'}`}>{friend.lastSeen}</div>
                </div>

                {/* Message input and actions */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center input input-bordered input-sm bg-base-200 text-sm opacity-60">
                      Messages
                    </div>
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
        ))}
      </div>
    </div>
  );
};

export default FriendsPage;