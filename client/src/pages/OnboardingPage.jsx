import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { LoaderIcon, MapPinIcon, ShuffleIcon, Phone, X, Users } from "lucide-react";
import { LANGUAGES } from "../constants";
import ThemeSelector from "../components/ThemeSelector";
import FemaleSymbol from "../assets/icons/female-symbol.svg";
import MaleSymbol from "../assets/icons/male-symbol.svg";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const suggestedSkills = [
    "Time Management",
    "Communication",
    "Leadership",
    "Coordination",
    "Problem Solving",
    "Organization",
    "Customer Service",
    "Programming",
    "Design",
    "Marketing",
    "Sales",
    "Project Management",
    "Public Speaking",
    "Data Analysis",
    "Web Development",
    "UI/UX Design",
    "Graphic Design",
    "Copywriting",
    "Content Creation",
    "Teaching",
    "Financial Analysis",
    "Business Strategy",
    "Negotiation",
    "Team Building",
    "Mentoring",
    "Critical Thinking",
    "Research",
    "Technical Writing",
    "Social Media Management",
    "Content Strategy",
    "Digital Marketing",
    "SEO",
    "Email Marketing",
    "Brand Management",
    "Public Relations",
    "Event Planning",
    "Community Management",
    "Influencer Relations",
    "Social Media Analytics",
    "Video Production",
    "Photography",
    "Editing",
    "Animation",
    "Illustration",
    "Adobe Creative Suite",
    "Figma",
    "Sketch",
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "Database Design",
    "API Development",
    "Mobile App Development",
    "Cloud Computing",
    "DevOps",
    "Cybersecurity",
    "AI/Machine Learning",
    "Data Science",
    "Excel",
    "Tableau",
    "Power BI",
    "Business Analysis",
    "Accounting",
    "Bookkeeping",
    "Tax Planning",
    "Investment Management",
    "Legal Expertise",
    "Contract Management",
    "Human Resources",
    "Recruitment",
    "Employee Relations",
    "Training & Development",
    "Supply Chain Management",
    "Logistics",
    "Inventory Management",
    "Quality Assurance",
    "Customer Success",
    "User Experience Research",
    "Product Management",
    "Agile Methodology",
    "Scrum",
    "Kanban",
    "Documentation",
    "Presentation Skills",
    "Writing",
    "Editing",
    "Proofreading",
    "Translation",
    "Language Teaching",
    "Tutoring",
    "Online Course Creation",
    "Podcast Production",
    "Voiceover",
    "Audio Engineering",
    "Music Production",
    "DJing",
    "Music Composition",
    "Personal Training",
    "Fitness Coaching",
    "Nutrition Counseling",
    "Life Coaching",
    "Career Counseling",
    "Therapy/Counseling",
    "Real Estate",
    "Property Management",
    "Interior Design",
    "Architecture",
    "Construction Management",
    "Carpentry",
    "Plumbing",
    "Electrical Work",
    "Automotive Repair",
    "Cooking",
    "Baking",
    "Nutrition",
    "Food Photography",
    "Recipe Development",
    "Hospitality Management",
    "Customer Service Excellence",
    "Travel Planning",
    "Tour Guiding",
    "Language Skills",
    "Cultural Consultation",
  ];

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
    phone: authUser?.phone || "",
    gender: authUser?.gender || "",
    skills: authUser?.skills || [],
  });

  const [skillSearch, setSkillSearch] = useState("");
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState("");

  const filteredSkillSuggestions = skillSearch
    ? suggestedSkills.filter((s) => {
        const query = skillSearch.toLowerCase();
        return s.toLowerCase().includes(query) && !formState.skills.includes(s);
      })
    : suggestedSkills.filter((s) => !formState.skills.includes(s));

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarded successfully");
      toast.custom((t) => (
        <div className="bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <div className="flex-1">
            <p className="font-semibold">Complete your profile</p>
            <p className="text-sm text-base-content/70">Add more details for better visibility</p>
          </div>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              navigate("/profile");
            }}
            className="btn btn-sm btn-primary"
          >
            Go to Profile
          </button>
        </div>
      ), {
        duration: 6000,
      });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },

    onError: (error) => {
      toast.error(error.response.data.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onboardingMutation(formState);
  };

  const handleRandomAvatar = () => {
    const colors = [
      '#8b9dc3', '#6b8bb8', '#5a7ba6', '#4a6b94', '#3a5b84', '#2a4b74', 
      '#748c9e', '#5d7a8f', '#95a8b8', '#a5b5c5', '#7c91a8', '#6c8199',
      '#ff6b6b', '#ee5a6f', '#c92a2a', '#e74c3c', '#d63031', '#fd79a8',
      '#74b9ff', '#0984e3', '#2d3436', '#636e72', '#2ecc71', '#27ae60',
      '#f39c12', '#e67e22', '#9b59b6', '#8e44ad', '#1abc9c', '#16a085',
      '#34495e', '#2c3e50', '#c0392b', '#e91e63', '#3f51b5', '#2196f3',
      '#ff9800', '#795548', '#673ab7', '#00bcd4', '#009688', '#4caf50'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const bgColor = '#f5f5f5';
    
    const randomAvatar = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="${bgColor}"/><circle cx="100" cy="75" r="35" fill="${randomColor}"/><ellipse cx="100" cy="160" rx="60" ry="50" fill="${randomColor}"/></svg>`)}`;

    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Profile picture updated!");
  };

  const addSkill = (skill) => {
    if (!formState.skills.includes(skill)) {
      setFormState({
        ...formState,
        skills: [...formState.skills, skill],
      });
    }
    setSkillSearch("");
    setShowSkillSuggestions(false);
  };

  const addCustomSkill = () => {
    const trimmedSkill = customSkillInput.trim();
    if (trimmedSkill && !formState.skills.includes(trimmedSkill)) {
      setFormState({
        ...formState,
        skills: [...formState.skills, trimmedSkill],
      });
      setCustomSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormState({
      ...formState,
      skills: formState.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 13);
    setFormState({ ...formState, phone: value });
  };

  const handleProfilePictureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result;
      setFormState({ ...formState, profilePic: base64String });
      toast.success('Profile picture updated!');
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-900 via-base-800 to-base-900 flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
      {/* Theme Selector - Top Right Corner */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeSelector />
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-56 h-56 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-56 h-56 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-2xl px-4">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3 sm:mb-4">
            Complete Your Profile
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60">
            Tell us about yourself and your expertise
          </p>
        </div>

        {/* Main Card */}
        <div className="card bg-base-100/95 backdrop-blur-xl shadow-2xl border border-base-300/30 overflow-hidden">
          <div className="card-body p-4 sm:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300"></div>
                  <div className="relative size-24 sm:size-28 rounded-full bg-base-200 overflow-hidden border-4 border-base-300 shadow-lg">
                    {formState.profilePic ? (
                      <img
                        src={formState.profilePic}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-base-300 to-base-400">
                        <svg className="size-12 sm:size-14 lg:size-16 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <label className="btn btn-xs sm:btn-sm btn-outline btn-primary gap-1.5 text-xs cursor-pointer">
                    <svg className="size-3 sm:size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                  </label>
                  <button 
                    type="button" 
                    onClick={handleRandomAvatar} 
                    className="btn btn-xs sm:btn-sm btn-outline btn-primary gap-1.5 text-xs"
                  >
                    <ShuffleIcon className="size-3 sm:size-4" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="space-y-4">
                {/* Full Name */}
                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text text-xs sm:text-sm font-semibold text-base-content">Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formState.fullName}
                    onChange={(e) => setFormState({ ...formState, fullName: e.target.value.slice(0, 50) })}
                    maxLength="50"
                    className="input input-bordered input-sm w-full bg-base-200/60 hover:bg-base-200/80 focus:bg-base-100 transition-colors border-base-300 focus:border-primary text-xs"
                    placeholder="e.g., Tito Mars"
                  />
                  <span className="text-xs text-base-content/50 mt-1">{formState.fullName.length}/50</span>
                </div>

                {/* Bio */}
                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text text-xs sm:text-sm font-semibold text-base-content">Bio</span>
                  </label>
                  <textarea
                    name="bio"
                    value={formState.bio}
                    onChange={(e) => setFormState({ ...formState, bio: e.target.value.slice(0, 300) })}
                    maxLength="300"
                    className="textarea textarea-bordered w-full bg-base-200/60 hover:bg-base-200/80 focus:bg-base-100 transition-colors border-base-300 focus:border-primary resize-none h-20 text-xs"
                    placeholder="Tell us about yourself and your learning goals"
                  />
                  <span className="text-xs text-base-content/50 mt-1">{formState.bio.length}/300</span>
                </div>

                {/* Languages Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text text-xs sm:text-sm font-semibold text-base-content">Native Language</span>
                    </label>
                    <select
                      name="nativeLanguage"
                      value={formState.nativeLanguage}
                      onChange={(e) => setFormState({ ...formState, nativeLanguage: e.target.value })}
                      className="select select-bordered select-sm w-full bg-base-200/60 hover:bg-base-200/80 focus:bg-base-100 transition-colors border-base-300 focus:border-primary text-xs"
                    >
                      <option value="">Select your native language</option>
                      {LANGUAGES.map((lang) => (
                        <option key={`native-${lang}`} value={lang.toLowerCase()}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text text-xs sm:text-sm font-semibold text-base-content">Learning Language</span>
                    </label>
                    <select
                      name="learningLanguage"
                      value={formState.learningLanguage}
                      onChange={(e) => setFormState({ ...formState, learningLanguage: e.target.value })}
                      className="select select-bordered select-sm w-full bg-base-200/60 hover:bg-base-200/80 focus:bg-base-100 transition-colors border-base-300 focus:border-primary text-xs"
                    >
                      <option value="">Select language you're learning</option>
                      {LANGUAGES.map((lang) => (
                        <option key={`learning-${lang}`} value={lang.toLowerCase()}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location & Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text text-xs sm:text-sm font-semibold text-base-content">Location</span>
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-4 text-base-content/50" />
                      <input
                        type="text"
                        name="location"
                        value={formState.location}
                        onChange={(e) => setFormState({ ...formState, location: e.target.value.slice(0, 50) })}
                        maxLength="50"
                        className="input input-bordered input-sm w-full pl-10 bg-base-200/60 hover:bg-base-200/80 focus:bg-base-100 transition-colors border-base-300 focus:border-primary text-xs"
                        placeholder="City, Country"
                      />
                    </div>
                    <span className="text-xs text-base-content/50 mt-1">{formState.location.length}/50</span>
                  </div>

                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text text-xs sm:text-sm font-semibold text-base-content">Phone Number</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute top-1/2 transform -translate-y-1/2 left-3 size-4 text-base-content/50" />
                      <input
                        type="tel"
                        name="phone"
                        value={formState.phone}
                        onChange={handlePhoneChange}
                        maxLength="13"
                        className="input input-bordered input-sm w-full pl-10 bg-base-200/60 hover:bg-base-200/80 focus:bg-base-100 transition-colors border-base-300 focus:border-primary text-xs"
                        placeholder="+63 976 789 1329"
                      />
                    </div>
                    <span className="text-xs text-base-content/50 mt-1">{formState.phone.length}/13</span>
                  </div>
                </div>

                {/* Gender Selection */}
                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text text-xs sm:text-sm font-semibold text-base-content">Gender</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Female */}
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, gender: "female" })}
                      className={`rounded-lg border-2 transition-all flex flex-col items-center justify-center py-3 ${
                        formState.gender === "female"
                          ? "border-pink-500 bg-pink-50 shadow-md"
                          : "border-base-300 bg-base-200/60 hover:border-pink-300 hover:bg-base-200/80"
                      }`}
                    >
                      <svg 
                        className="w-6 h-6 mb-1"
                        viewBox="0 0 247.582 247.582"
                        fill="currentColor"
                        style={{
                          color: formState.gender === "female" ? "#ec4899" : "rgba(0,0,0,0.3)"
                        }}
                      >
                        <path d="M127.581,91.404c0-35.162-28.523-63.769-63.686-63.769S0,56.242,0,91.404c0,31.068,22.666,57.003,51.666,62.625v27.99
                          l-8.184-7.057l-13.471,16.039l34.295,28.945l35.335-28.831l-13.437-16.268l-9.537,7.658v-28.674
                          C105.666,147.804,127.581,122.105,127.581,91.404z M25.208,91.404c0-21.377,17.392-38.769,38.77-38.769s38.77,17.392,38.77,38.769
                          c0,21.378-17.392,38.77-38.77,38.77S25.208,112.782,25.208,91.404z"/>
                      </svg>
                      <span className={`font-medium text-xs transition-all ${formState.gender === "female" ? "text-pink-700" : "text-base-content/60"}`}>
                        Female
                      </span>
                    </button>

                    {/* Male */}
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, gender: "male" })}
                      className={`rounded-lg border-2 transition-all flex flex-col items-center justify-center py-3 ${
                        formState.gender === "male"
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-base-300 bg-base-200/60 hover:border-blue-300 hover:bg-base-200/80"
                      }`}
                    >
                      <svg 
                        className="w-6 h-6 mb-1"
                        viewBox="0 0 247.582 247.582"
                        fill="currentColor"
                        style={{
                          color: formState.gender === "male" ? "#3b82f6" : "rgba(0,0,0,0.3)"
                        }}
                      >
                        <path d="M196.666,93.047V76.445h10v-21h-10v-15h-25v15h-11v21h11v16.424c-29,5.64-51.581,31.564-51.581,62.617
                          c0,35.162,28.69,63.769,63.852,63.769c35.163,0,63.645-28.606,63.645-63.769C247.582,124.769,225.666,99.059,196.666,93.047z
                          M184.021,194.254c-21.377,0-38.769-17.392-38.769-38.769c0-21.378,17.392-38.77,38.769-38.77c21.378,0,38.77,17.392,38.77,38.77
                          C222.79,176.863,205.399,194.254,184.021,194.254z"/>
                      </svg>
                      <span className={`font-medium text-xs transition-all ${formState.gender === "male" ? "text-blue-700" : "text-base-content/60"}`}>
                        Male
                      </span>
                    </button>

                    {/* Rather Not Say */}
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, gender: "prefer_not_to_say" })}
                      className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                        formState.gender === "prefer_not_to_say"
                          ? "border-purple-500 bg-purple-50 shadow-md"
                          : "border-base-300 bg-base-200/60 hover:border-purple-300 hover:bg-base-200/80"
                      }`}
                    >
                      <Users className={`w-6 h-6 mb-1 ${formState.gender === "prefer_not_to_say" ? "text-purple-500" : "text-gray-600 opacity-60"}`} />
                      <span className={`font-medium text-center transition-all ${formState.gender === "prefer_not_to_say" ? "text-purple-700 text-xs" : "text-xs text-base-content/60"}`}>
                        Rather Not
                      </span>
                    </button>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text text-xs sm:text-sm font-semibold text-base-content">Skills & Expertise</span>
                    <span className="text-xs text-base-content/50">Select or add custom skills</span>
                  </label>
                  <div className="space-y-2">
                    {/* Skills Dropdown with Search */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSkillSuggestions(!showSkillSuggestions)}
                        className="btn btn-sm btn-outline w-full justify-start text-left h-auto px-3 py-2"
                      >
                        {formState.skills.length > 0 ? `${formState.skills.length} skill${formState.skills.length !== 1 ? 's' : ''} selected` : 'Select skills...'}
                      </button>

                      {showSkillSuggestions && (
                        <div className="absolute z-20 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-hidden flex flex-col" onMouseLeave={() => setShowSkillSuggestions(false)}>
                          {/* Search Input Inside Dropdown */}
                          <div className="p-2 border-b border-base-300 sticky top-0 bg-base-100">
                            <input
                              type="text"
                              value={skillSearch}
                              onChange={(e) => setSkillSearch(e.target.value)}
                              placeholder="Search skills..."
                              className="input input-bordered input-xs w-full text-xs"
                              autoFocus
                            />
                          </div>

                          {/* Skills List */}
                          <div className="overflow-y-auto flex-1">
                            {filteredSkillSuggestions.length > 0 ? (
                              filteredSkillSuggestions.map((skill) => (
                                <button
                                  type="button"
                                  key={skill}
                                  onClick={() => {
                                    addSkill(skill);
                                    setShowSkillSuggestions(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-primary/10 hover:text-primary transition-colors border-b border-base-300/20 last:border-b-0 font-medium text-xs"
                                >
                                  {skill}
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-xs text-base-content/50">No skills found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Custom Skill Input */}
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value.slice(0, 30))}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                        maxLength="30"
                        className="input input-bordered input-sm flex-1 bg-base-200/60 hover:bg-base-200/80 focus:bg-base-100 transition-colors border-base-300 focus:border-primary text-xs"
                        placeholder="Add custom skill..."
                      />
                      <button
                        type="button"
                        onClick={addCustomSkill}
                        className="btn btn-primary btn-sm"
                      >
                        Add
                      </button>
                    </div>
                    <span className="text-xs text-base-content/50">{customSkillInput.length}/30</span>

                    {/* Skills Display */}
                    {formState.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {formState.skills.map((skill) => (
                          <div
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-primary/15 to-secondary/15 border border-primary/25 text-primary rounded-full text-xs font-medium hover:from-primary/25 hover:to-secondary/25 transition-all"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="hover:opacity-60 transition-opacity"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                className="btn btn-primary btn-md w-full gap-2 mt-6 font-semibold shadow-lg hover:shadow-xl transition-all" 
                disabled={isPending} 
                type="submit"
              >
                {!isPending ? (
                  <>
                    <span>Complete Onboarding</span>
                  </>
                ) : (
                  <>
                    <LoaderIcon className="animate-spin size-4" />
                    <span>Processing...</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OnboardingPage;
