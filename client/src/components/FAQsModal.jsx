import { useState } from "react";
import { X, ChevronDown } from "lucide-react";

const FAQsModal = ({ isOpen, onClose }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqs = [
    {
      category: "Getting Started",
      items: [
        {
          question: "How do I create an account?",
          answer: "Visit the login page and click on 'Sign Up'. Fill in your email, password, and basic information. You'll then be guided through the onboarding process to complete your profile."
        },
        {
          question: "How do I complete my profile?",
          answer: "After signing up, go to the Onboarding page to add your bio, native language, learning language, location, and skills. You can also upload a profile picture or generate an avatar."
        },
        {
          question: "What languages are supported?",
          answer: "We support a wide range of languages including English, Spanish, French, German, Mandarin, Japanese, and many more. You can select your native and learning languages during onboarding."
        }
      ]
    },
    {
      category: "Friends & Connections",
      items: [
        {
          question: "How do I add friends?",
          answer: "Go to the 'Set Up Your Next Session' section on the homepage and browse recommended users. Click 'Add Friend' to send a friend request. You can also search by name or location to find specific people."
        },
        {
          question: "How do I manage friend requests?",
          answer: "Visit the Notifications page to view incoming friend requests. You can accept or decline requests. Accepted friends will appear in your Friends list."
        },
        {
          question: "Can I see who's online?",
          answer: "Yes! Your Friends section shows online status with color indicators. Green means available, yellow means limited availability, and gray means offline. You can see active contacts on your dashboard."
        },
        {
          question: "How do I find people with similar interests?",
          answer: "Use the language filter on the homepage to find people learning or speaking the same language. You can also search by location to connect with people in your area."
        }
      ]
    },
    {
      category: "Appointments & Scheduling",
      items: [
        {
          question: "How do I book an appointment?",
          answer: "Click 'Add Friend' to add someone, then visit the Appointments page. Click 'Book an Appointment' and select a date/time from their available slots. Wait for them to confirm."
        },
        {
          question: "How do I set my availability?",
          answer: "Go to the Availability Settings in your profile. Toggle your availability status (Available/Limited/Away) and set your available time slots. You can update these anytime."
        },
        {
          question: "What does appointment status mean?",
          answer: "Pending = waiting for confirmation, Confirmed = both agreed, Completed = finished, Cancelled = cancelled by either party, Rescheduled = moved to a new time."
        },
        {
          question: "Can I reschedule an appointment?",
          answer: "Yes, visit the Appointments page, find the appointment, and click 'Reschedule' to select a new time from available slots."
        },
        {
          question: "How do reminders work?",
          answer: "You'll receive notifications before your scheduled appointments. The reminder timing helps ensure you don't miss important sessions."
        }
      ]
    },
    {
      category: "Video Calls & Chat",
      items: [
        {
          question: "How do I join a video call?",
          answer: "When an appointment time arrives, you'll see a 'Join Call' button. Click it to connect to the video call. Make sure your camera and microphone are enabled."
        },
        {
          question: "Can I chat before meeting?",
          answer: "Yes! Click on any friend to start a conversation. Use the chat feature to discuss appointment details or just get to know each other."
        },
        {
          question: "How do I share files in chat?",
          answer: "The chat interface supports text messages. For file sharing during video calls, you can use the built-in screen sharing feature."
        },
        {
          question: "What if my video doesn't work?",
          answer: "Check that your camera and microphone are enabled in your browser settings. Try refreshing the page or joining the call again. Ensure your internet connection is stable."
        }
      ]
    },
    {
      category: "Skills & Profile",
      items: [
        {
          question: "How do I add skills?",
          answer: "During onboarding or in your profile, add your skills from our suggested list or create custom skills. These help others find you for specific expertise."
        },
        {
          question: "Can I change my profile picture?",
          answer: "Yes, go to your profile or onboarding page. You can upload an image from your device or generate a random avatar with different colors."
        },
        {
          question: "How do I update my profile information?",
          answer: "Visit your Profile page to update your bio, location, phone number, languages, skills, and other details. Changes are saved instantly."
        },
        {
          question: "What is the profile picture size limit?",
          answer: "Profile pictures must be image files and should not exceed 5MB in size."
        }
      ]
    },
    {
      category: "Dashboard & Analytics",
      items: [
        {
          question: "What do the analytics cards show?",
          answer: "Your dashboard displays Total Appointments, Completed Calls, Active Contacts (online friends), Pending Appointments, and Friend Requests. You can compare metrics across different time periods."
        },
        {
          question: "How do I view statistics?",
          answer: "Use the period selector on your dashboard to view stats for Yesterday, Last 7 Days, or Last 30 Days. Each metric shows the change compared to the previous period."
        },
        {
          question: "Can I track completed calls?",
          answer: "Yes, the 'Completed Calls' card shows how many appointments you've finished. This metric is updated in real-time after calls conclude."
        }
      ]
    },
    {
      category: "Account & Privacy",
      items: [
        {
          question: "How do I logout?",
          answer: "Click the profile icon in the navbar and select 'Logout'. You'll be signed out and redirected to the landing page."
        },
        {
          question: "Is my information private?",
          answer: "Your profile information is visible to other users on the platform to help with connections. You control what information you share."
        },
        {
          question: "Can I block someone?",
          answer: "You can remove friends from your friends list. For safety concerns, please contact support with details."
        },
        {
          question: "What happens if I delete a friend?",
          answer: "Removing a friend will prevent them from seeing you in recommendations and remove future appointments between you two. Past chat history is preserved."
        }
      ]
    },
    {
      category: "Troubleshooting",
      items: [
        {
          question: "Why can't I see recommended users?",
          answer: "Make sure you've completed your onboarding profile. Recommendations are personalized based on your language preferences. Try adjusting your language filter."
        },
        {
          question: "Why haven't I received a notification?",
          answer: "Check your Notifications page. Make sure browser notifications are enabled. Refresh the page to sync the latest updates."
        },
        {
          question: "How do I report a problem?",
          answer: "If you encounter issues, please note the error details and contact our support team with a description of what happened."
        },
        {
          question: "Why is the app loading slowly?",
          answer: "Try refreshing the page or clearing your browser cache. Check your internet connection. If issues persist, try using a different browser."
        }
      ]
    }
  ];

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const allFaqItems = faqs.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      category: category.category
    }))
  );

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Frequently Asked Questions</h1>
                <p className="text-white/80 text-sm mt-1">Find answers to common questions about Appoint.</p>
              </div>
              <button
                onClick={onClose}
                className="btn btn-circle btn-sm btn-ghost text-white hover:bg-white/20"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-3">
              {faqs.map((category) => (
                <div key={category.category}>
                  <h2 className="text-lg font-semibold text-primary mb-3 sticky top-0 bg-base-100 py-2">
                    {category.category}
                  </h2>
                  <div className="space-y-2">
                    {category.items.map((item, idx) => {
                      const globalIndex = allFaqItems.findIndex((faq) =>
                        faq.question === item.question && faq.category === category.category
                      );
                      const isExpanded = expandedIndex === globalIndex;

                      return (
                        <div
                          key={`${category.category}-${idx}`}
                          className="border border-base-300 rounded-lg overflow-hidden hover:border-primary/50 transition-all"
                        >
                          <button
                            onClick={() => toggleExpand(globalIndex)}
                            className="w-full p-4 flex items-center justify-between bg-base-200/50 hover:bg-base-200 transition-colors text-left"
                          >
                            <span className="font-medium text-base-content">{item.question}</span>
                            <ChevronDown
                              className={`size-5 text-primary transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {isExpanded && (
                            <div className="p-4 bg-base-100 border-t border-base-300 text-base-content/80">
                              {item.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="divider my-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FAQsModal;
