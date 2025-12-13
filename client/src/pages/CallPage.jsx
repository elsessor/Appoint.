import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getStreamToken, createMeetingMinutes } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import { Mic, MicOff } from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const params = useParams();
  const callId = params.id || params.channelId || params.callId;
  
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { authUser, isLoading } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken", authUser?._id],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
  const initCall = async () => {
    if (!tokenData?.token || !authUser || !callId) return;

    try {
      console.log("Initializing Stream video client...");

      // Only pass essential fields - ensure they're strings/primitives
      const user = {
        id: String(authUser._id),
        name: String(authUser.fullName || "Unknown User"),
        // If profilePic is base64, it might be too large - use a default or URL only
        image: authUser.profilePic?.startsWith('http') 
          ? authUser.profilePic 
          : undefined, // Don't include if it's base64
      };

      // Debug: Check size
      const userDataSize = new Blob([JSON.stringify(user)]).size;
      console.log(`User data size: ${userDataSize} bytes (limit: 5120)`);

      if (userDataSize > 5120) {
        console.error("User data too large:", user);
        throw new Error("User data exceeds 5KB limit");
      }

      const videoClient = new StreamVideoClient({
        apiKey: STREAM_API_KEY,
        user,
        token: tokenData.token,
      });

      const callInstance = videoClient.call("default", callId);

      await callInstance.join({ create: true });

      console.log("Joined call successfully");

      setClient(videoClient);
      setCall(callInstance);
    } catch (error) {
      console.error("Error joining call:", error);
      toast.error("Could not join the call. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  initCall();
}, [tokenData, authUser, callId]);

  if (isLoading || isConnecting) return <PageLoader />;

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-base-100" data-theme="night">
      <div className="relative w-full h-full">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent callId={callId} authUser={authUser} />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = ({ callId, authUser }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [startTime, setStartTime] = useState(null);
  const recognitionRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Mutation for creating meeting minutes
  const createMinutesMutation = useMutation({
    mutationFn: createMeetingMinutes,
    onSuccess: () => {
      toast.success("Meeting minutes generated successfully! Check the Meeting Minutes page.");
    },
    onError: (error) => {
      console.error("Error creating minutes:", error);
      toast.error("Failed to generate meeting minutes");
    },
  });

  // Initialize speech recognition ONCE
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
  console.log("🎤 Speech recognition started");
  setRetryCount(0); // Reset on successful start
};
    recognition.onresult = (event) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        console.log("📝 Captured:", transcriptPiece, "Final:", event.results[i].isFinal);
        
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + " ";
        }
      }

      if (finalTranscript) {
        console.log("✅ Final transcript added:", finalTranscript);
        setTranscript((prev) => {
          const newTranscript = prev + finalTranscript;
          console.log("📝 Total transcript now:", newTranscript);
          return newTranscript;
        });
      }
    };

    recognition.onerror = (event) => {
  console.error("❌ Speech recognition error:", event.error);
  
  switch(event.error) {
    case 'network':
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        setRetryCount(prev => prev + 1);
        
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Retry failed:', e);
          }
        }, 2000);
      } else {
        toast.error('Network error - check your internet connection');
        setIsRecording(false);
      }
      break;
      
    case 'not-allowed':
    case 'service-not-allowed':
      toast.error('Microphone permission denied. Please allow microphone access.');
      setIsRecording(false);
      break;
      
    case 'no-speech':
      console.log("⚠️ No speech detected, but continuing...");
      break;
      
    case 'aborted':
      console.log('Recognition aborted');
      setIsRecording(false);
      break;
      
    default:
      toast.error(`Speech recognition error: ${event.error}`);
      setIsRecording(false);
  }
};

    recognition.onend = () => {
      console.log("🛑 Recognition ended");
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log("Recognition already stopped");
        }
      }
    };
  }, []);

  // Start recording
  const startRecording = async () => {
  if (!recognitionRef.current) {
    toast.error("Speech recognition not supported in your browser. Please use Chrome or Edge.");
    return;
  }

  // Check microphone access FIRST
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // Release immediately
    console.log("✅ Microphone access granted");
  } catch (error) {
    console.error("❌ Microphone access denied:", error);
    toast.error("Please allow microphone access to record the meeting.");
    return;
  }

  setTranscript("");
  setStartTime(new Date());
  setIsRecording(true);
  
  try {
    recognitionRef.current.start();
    console.log("✅ Recording started, speak now!");
    toast.success("🎤 Recording started - Speak now!", { duration: 3000 });
  } catch (error) {
    console.error("❌ Error starting recognition:", error);
    toast.error("Could not start recording: " + error.message);
    setIsRecording(false);
  }
};

  // Stop recording and generate minutes
  const stopRecording = async () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.log("Recognition already stopped");
    }
    
    setIsRecording(false);

    // Wait for final results
    await new Promise(resolve => setTimeout(resolve, 2000));

    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 60000);

    const finalTranscript = transcript.trim();
    
    console.log("📊 Final transcript:", finalTranscript);
    console.log("📏 Transcript length:", finalTranscript.length);

    if (finalTranscript.length === 0) {
      toast.error("No speech detected. Please check your microphone and try again.");
      return;
    }

    toast.loading("Generating meeting minutes...", { id: "generating" });

    const userIds = callId.split("-");
    const targetUserId = userIds.find((id) => id !== authUser._id) || callId;

    createMinutesMutation.mutate({
      callId,
      targetUserId,
      transcript: finalTranscript,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: Math.max(1, duration),
    });

    toast.dismiss("generating");
  };

  if (callingState === CallingState.LEFT) {
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Recognition already stopped");
      }
    }
    
    // Show option to create meeting minutes after call
    return (
      <div className="h-screen flex items-center justify-center bg-base-100">
        <div className="card bg-base-200 shadow-xl max-w-md">
          <div className="card-body">
            <h2 className="card-title">Call Ended</h2>
            <p>Would you like to create meeting minutes for this call?</p>
            
            <div className="card-actions justify-end mt-4">
              <button 
                onClick={() => navigate("/")} 
                className="btn btn-ghost"
              >
                No, Go Home
              </button>
              <button 
                onClick={() => navigate(`/create-minutes/${callId}`)} 
                className="btn btn-primary"
              >
                Create Meeting Minutes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <StreamTheme>
        <SpeakerLayout />
        <CallControls />

        {/* Recording Controls Overlay */}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
          {/* Recording Status */}
          {isRecording && (
            <div className="badge badge-error gap-2 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              Recording
            </div>
          )}

          {/* Recording Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`btn btn-circle ${isRecording ? "btn-error" : "btn-primary"}`}
            title={isRecording ? "Stop & Generate Minutes" : "Start Recording"}
            disabled={createMinutesMutation.isPending}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Transcript Preview (when recording) */}
          {isRecording && transcript && (
            <div className="card bg-base-200 shadow-lg max-w-xs max-h-40 overflow-y-auto">
              <div className="card-body p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-4 h-4" />
                  <span className="text-xs font-semibold">Live Transcript</span>
                </div>
                <p className="text-xs text-gray-300 whitespace-pre-wrap">{transcript}</p>
              </div>
            </div>
          )}
        </div>
      </StreamTheme>
    </div>
  );
};

export default CallPage;