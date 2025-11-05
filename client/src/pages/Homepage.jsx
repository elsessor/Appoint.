import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageLoader from "../components/PageLoader";
import {
  getUserFriends,
  getRecommendedUsers,
  getOutgoingFriendReqs,
  sendFriendRequest,
} from "../lib/api";
import { getLanguageFlag } from "../components/FriendCard";
import { capitalize } from "../lib/utils";

const EMPTY_ARR = [];

const HomePage = () => {
  const queryClient = useQueryClient();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());

  const { data: friends = EMPTY_ARR, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = EMPTY_ARR, isLoading: loadingUsers } = useQuery({
    queryKey: ["recommendedUsers"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReqs = EMPTY_ARR } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { mutate: sendRequestMutation, isLoading: sending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
  });

  useEffect(() => {
    const setIds = new Set();
    (outgoingFriendReqs || []).forEach((req) => {
      const id = req.recipient?._id || req.recipient || req.to || null;
      if (id) setIds.add(id);
    });
    setOutgoingRequestsIds(setIds);
  }, [outgoingFriendReqs]);

  if (loadingFriends || loadingUsers) return <PageLoader />;

  const placeholders = [
    {
      _id: "ph-1",
      fullName: "Chambers",
      profilePic: "/chamber.jpg",
      location: "Madrid, Spain",
      nativeLanguage: "Spanish",
      learningLanguage: "English",
      bio: "¡Hola! I help beginners master conversational Spanish.",
    },
    {
      _id: "ph-2",
      fullName: "Lings",
      profilePic: "/ling.jpg",
      location: "Madrid, Spain",
      nativeLanguage: "Spanish",
      learningLanguage: "English",
      bio: "¡Hola! I help beginners master conversational Spanish.",
    },
    {
      _id: "ph-3",
      fullName: "Richard Suñas",
      profilePic: "/richard.jpg",
      location: "Bato, France",
      nativeLanguage: "French",
      learningLanguage: "Mandarin",
      bio: "Bonjour! I like practicing conversation.",
    },
    {
      _id: "ph-4",
      fullName: "Mick Morales",
      profilePic: "/mick.jpg",
      location: "Bagasbas, Poland",
      nativeLanguage: "Polish",
      learningLanguage: "Filipino",
      bio: "Hi! I enjoy teaching everyday conversation.",
    },
  ];
    
  const friendPlaceholders = [
    { _id: "f-ph-1", fullName: "Larry", profilePic: "/larry.jpg" },
    { _id: "f-ph-2", fullName: "Bon", profilePic: "/bon.jpg" },
    { _id: "f-ph-3", fullName: "Jinwoo", profilePic: "/sungjinwoo.jpg" },
    { _id: "f-ph-4", fullName: "Nina", profilePic: "/profile.jpg" },
    { _id: "f-ph-5", fullName: "Sam", profilePic: "/profile.jpg" },
    { _id: "f-ph-6", fullName: "Maya", profilePic: "/profile.jpg" },
  ];


  const displayedFriends = [...friends, ...friendPlaceholders].slice(0, 12);

  const mainFriends = displayedFriends.slice(0, 3);
  const otherFriends = displayedFriends.slice(3, 12);


  const merged = placeholders.map((p, i) => (recommendedUsers[i] ? recommendedUsers[i] : p));
  const coaches = merged.slice(0, 2);
  const meetPeople = merged.slice(2, 4);

  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 gap-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              <span className="text-primary">Good morning,</span>{" "}
              <span className="text-white">Hans!</span>
            </h1>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mt-6">Friends</h2>

            <div className="mt-6 flex items-center gap-8">
              <div className="flex items-center gap-6">
                {mainFriends.map((f) => (
                  <div key={f._id || f.fullName} className="flex flex-col items-center group">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 hover:border-primary transition-all duration-300 transform hover:scale-105">
                      <img src={f.profilePic || "/profile.jpg"} alt={f.fullName} className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-3 text-base font-medium text-white group-hover:text-primary transition-colors">{f.fullName}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/notifications" className="btn btn-outline btn-sm rounded-lg border-primary/20 hover:border-primary hover:bg-primary/10 transition-all duration-300">
              Friend Requests
            </Link>
          </div>
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-primary">Popular Language Coaches</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coaches.map((coach) => (
              <div key={coach._id} className="rounded-2xl bg-base-200 p-6 shadow-xl flex items-center gap-6">
                <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                  <img src={coach.profilePic || "/profile.png"} alt={coach.fullName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{coach.fullName}</h3>
                      <div className="text-xs opacity-60 mt-1">{coach.location}</div>
                    </div>
                    <div className="text-sm opacity-70 flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400">★</span>
                        <span>Rating: 4.9</span>
                      </div>
                      <div className="text-xs opacity-50 mt-2">•••</div>
                    </div>
                  </div>

                  <p className="text-sm opacity-70 mt-3">{coach.bio}</p>

                  <div className="mt-4 flex gap-3">
                    <button
                      className="btn btn-info rounded-full px-6 py-2"
                      onClick={() => sendRequestMutation(coach._id)}
                      disabled={sending}
                    >
                      Send Friend Request
                    </button>
                    <button className="btn bg-[#091A4D] text-white hover:bg-[#1B2A59] border-0 rounded-full px-6 py-2 transition-all duration-300">Book a Lesson</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-1">Meet New People</h2>
          <p className="opacity-70 mb-6">Discover people based on your needs</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meetPeople.map((user) => {
              const hasRequestBeenSent = outgoingRequestsIds.has(user._id);
              return (
                <div key={user._id} className="rounded-2xl bg-base-200 p-5 shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <img src={user.profilePic || "/profile.jpg"} alt={user.fullName} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{user.fullName}</h3>
                          <div className="text-xs opacity-60">{user.location}</div>
                        </div>
                        <div className="text-xs opacity-50">•••</div>
                      </div>

                      <div className="flex gap-2 mt-3 flex-wrap">
                        <span className="badge badge-primary">
                          {getLanguageFlag(user.nativeLanguage)} Native: {capitalize(user.nativeLanguage || "N/A")}
                        </span>
                        <span className="badge badge-outline">
                          {getLanguageFlag(user.learningLanguage)} Learning: {capitalize(user.learningLanguage || "N/A")}
                        </span>
                      </div>

                      {user.bio && <p className="text-sm opacity-70 mt-3">{user.bio}</p>}

                      <div className="mt-4">
                        <button
                          className={`btn w-full ${hasRequestBeenSent ? "btn-disabled" : "btn-primary"}`}
                          onClick={() => sendRequestMutation(user._id)}
                          disabled={hasRequestBeenSent || sending}
                        >
                          {hasRequestBeenSent ? "Request Sent" : "Send Friend Request"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;