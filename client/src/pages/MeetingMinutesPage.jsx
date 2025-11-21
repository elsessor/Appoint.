import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserMeetingMinutes, deleteMeetingMinutes } from "../lib/api";
import { FileText, Calendar, Users, CheckCircle, Clock, ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import toast from "react-hot-toast";

const MeetingMinutesPage = () => {
  const [selectedMinutes, setSelectedMinutes] = useState(null);
  const queryClient = useQueryClient();

  const { data: minutes, isLoading } = useQuery({
    queryKey: ["meetingMinutes"],
    queryFn: getUserMeetingMinutes,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMeetingMinutes,
    onSuccess: () => {
      toast.success("Meeting minutes deleted successfully");
      queryClient.invalidateQueries(["meetingMinutes"]);
      setSelectedMinutes(null);
    },
    onError: () => {
      toast.error("Failed to delete meeting minutes");
    },
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete these meeting minutes?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (selectedMinutes) {
    return (
      <DetailedMinutesView 
        minutes={selectedMinutes} 
        onBack={() => setSelectedMinutes(null)}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Meeting Minutes</h1>
            <p className="text-gray-400">View all your meeting summaries and action items</p>
          </div>
          <div className="badge badge-primary badge-lg">
            {minutes?.length || 0} Meetings
          </div>
        </div>

        {!minutes || minutes.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-20 h-20 mx-auto text-gray-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No meeting minutes yet</h2>
            <p className="text-gray-400 mb-6">
              Generate your first meeting minutes from a call
            </p>
            <Link to="/homepage" className="btn btn-primary">
              Go to Home
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {minutes.map((meeting) => (
              <MeetingCard
                key={meeting._id}
                meeting={meeting}
                onClick={() => setSelectedMinutes(meeting)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MeetingCard = ({ meeting, onClick, onDelete }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(meeting._id);
  };

  return (
    <div
      onClick={onClick}
      className="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl"
    >
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="card-title text-2xl mb-2">
              {meeting.title || "Meeting Summary"}
            </h2>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(meeting.startTime)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {meeting.duration} minutes
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {meeting.participants?.length || 0} participants
              </div>
            </div>

            <p className="text-gray-300 mb-4 line-clamp-2">{meeting.summary}</p>

            <div className="flex flex-wrap gap-2">
              {meeting.keyPoints?.slice(0, 3).map((point, index) => (
                <span key={index} className="badge badge-outline badge-sm">
                  {point.substring(0, 50)}...
                </span>
              ))}
              {meeting.keyPoints?.length > 3 && (
                <span className="badge badge-ghost badge-sm">
                  +{meeting.keyPoints.length - 3} more
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <button
              onClick={handleDelete}
              className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error hover:text-white"
              title="Delete meeting minutes"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {meeting.actionItems?.length > 0 && (
              <div className="badge badge-warning">
                {meeting.actionItems.length} Action Items
              </div>
            )}
            {meeting.decisions?.length > 0 && (
              <div className="badge badge-success">
                {meeting.decisions.length} Decisions
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailedMinutesView = ({ minutes, onBack, onDelete }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = () => {
    onDelete(minutes._id);
  };

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="btn btn-ghost">
            <ArrowLeft className="w-5 h-5" />
            Back to All Meetings
          </button>

          <button
            onClick={handleDelete}
            className="btn btn-error btn-sm gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>

        <div className="card bg-base-200 shadow-2xl">
          <div className="card-body">
            <h1 className="text-4xl font-bold mb-4">
              {minutes.title || "Meeting Summary"}
            </h1>

            <div className="flex flex-wrap gap-6 mb-8 pb-6 border-b border-base-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-semibold">{formatDate(minutes.startTime)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-gray-500">Duration</div>
                  <div className="font-semibold">{minutes.duration} minutes</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-gray-500">Participants</div>
                  <div className="flex gap-2">
                    {minutes.participants?.map((participant) => (
                      <div key={participant._id} className="flex items-center gap-1">
                        <img
                          src={participant.profilePic || "/default-avatar.png"}
                          alt={participant.fullName}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="font-semibold text-sm">
                          {participant.fullName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Summary
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed bg-base-300 p-4 rounded-lg">
                {minutes.summary}
              </p>
            </section>

            {minutes.keyPoints?.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Key Discussion Points</h2>
                <ul className="space-y-3">
                  {minutes.keyPoints.map((point, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="text-primary font-bold">•</span>
                      <span className="text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {minutes.decisions?.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-success" />
                  Decisions Made
                </h2>
                <div className="space-y-3">
                  {minutes.decisions.map((decision, index) => (
                    <div key={index} className="alert alert-success">
                      <CheckCircle className="w-5 h-5" />
                      <span>{decision.decision}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {minutes.actionItems?.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Action Items</h2>
                <div className="space-y-3">
                  {minutes.actionItems.map((item, index) => (
                    <div key={index} className="card bg-base-300">
                      <div className="card-body p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-lg mb-1">{item.task}</p>
                            <p className="text-sm text-gray-400">
                              Assigned to: <span className="text-primary">{item.assignedTo}</span>
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            defaultChecked={item.completed}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {minutes.transcript && (
              <section>
                <div className="collapse collapse-arrow bg-base-300">
                  <input type="checkbox" />
                  <div className="collapse-title text-xl font-bold">
                    View Full Transcript
                  </div>
                  <div className="collapse-content">
                    <p className="text-gray-400 whitespace-pre-wrap leading-relaxed">
                      {minutes.transcript}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingMinutesPage;