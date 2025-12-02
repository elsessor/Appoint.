import { useState, useEffect } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { 
  Loader, 
  Camera, 
  Shuffle, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  Globe, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  Phone, 
  X, 
  Plus 
} from "lucide-react";
import { LANGUAGES, NATIONALITIES } from "../constants";

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    location: authUser?.location || "",
    nationality: authUser?.nationality || "",
    profession: authUser?.profession || "",
    phone: authUser?.phone || "",
    skills: authUser?.skills || [],
    profilePic: authUser?.profilePic || "",
    twitter: authUser?.twitter || "",
    linkedin: authUser?.linkedin || "",
    github: authUser?.github || "",
  });

  const [skillInput, setSkillInput] = useState("");
  const [imagePreview, setImagePreview] = useState(authUser?.profilePic || "");

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("onboarding_draft", JSON.stringify({ ...formState, currentStep }));
    } catch (e) {
      console.warn("Failed to save onboarding draft", e);
    }
  }, [formState, currentStep]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("onboarding_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormState(parsed);
        setCurrentStep(parsed.currentStep || 1);
        setImagePreview(parsed.profilePic || "");
      }
    } catch (e) {
      console.warn("Failed to load onboarding draft", e);
    }
  }, []);

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Welcome to Appoint! 🎉");
      try {
        localStorage.removeItem("onboarding_draft");
      } catch (e) {
        console.warn("Failed to remove onboarding draft", e);
      }
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Something went wrong");
    },
  });

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    setFormState({ ...formState, profilePic: randomAvatar });
    setImagePreview(randomAvatar);
    toast.success("Random avatar generated!");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormState({ ...formState, profilePic: base64String });
      setImagePreview(base64String);
      toast.success("Profile picture uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formState.skills.includes(skillInput.trim())) {
      setFormState({ 
        ...formState, 
        skills: [...formState.skills, skillInput.trim()] 
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormState({
      ...formState,
      skills: formState.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const validateStep = (step) => {
    switch(step) {
      case 2:
        if (!formState.fullName.trim()) {
          toast.error("Please enter your full name");
          return false;
        }
        if (!formState.bio.trim()) {
          toast.error("Please write a short bio");
          return false;
        }
        return true;
      case 3:
        if (!formState.nativeLanguage) {
          toast.error("Please select your native language");
          return false;
        }
        if (!formState.learningLanguage) {
          toast.error("Please select the language you're learning");
          return false;
        }
        return true;
      case 4:
        if (!formState.location.trim()) {
          toast.error("Please enter your location");
          return false;
        }
        if (!formState.nationality) {
          toast.error("Please select your nationality");
          return false;
        }
        if (formState.phone && formState.phone.trim()) {
          const phoneRegex = /^[\d\s\+\-\(\)]+$/;
          const digitCount = formState.phone.replace(/\D/g, '').length;
          
          if (!phoneRegex.test(formState.phone)) {
            toast.error("Phone number can only contain digits, spaces, +, -, and ()");
            return false;
          }
          
          if (digitCount < 10 || digitCount > 15) {
            toast.error("Phone number must contain 10-15 digits");
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(4)) {
      onboardingMutation(formState);
    }
  };

  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-2xl shadow-2xl">
        {/* Progress Bar */}
        <div className="w-full bg-base-300 h-2 rounded-t-xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="card-body p-6 sm:p-8">
          {/* Step Indicator */}
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-base-content/60">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="text-center space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-center">
                <div className="bg-primary/20 p-6 rounded-full">
                  <Sparkles className="w-16 h-16 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">
                Welcome to Appoint! 👋
              </h1>
              <p className="text-lg text-base-content/70 max-w-md mx-auto">
                Let's set up your profile so you can start booking and managing appointments with ease.
              </p>
              <button onClick={nextStep} className="btn btn-primary btn-lg gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
                <p className="text-base-content/60">This helps others get to know you</p>
              </div>

              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-32 rounded-full bg-base-300 overflow-hidden ring-4 ring-primary/20">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Camera className="w-12 h-12 text-base-content/40" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="btn btn-sm btn-primary">
                    <Camera className="w-4 h-4 mr-2" />
                    Upload
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                  <button onClick={handleRandomAvatar} className="btn btn-sm btn-accent">
                    <Shuffle className="w-4 h-4 mr-2" />
                    Random
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Full Name *</span>
                </label>
                <input
                  type="text"
                  value={formState.fullName}
                  onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                  className="input input-bordered input-lg"
                  placeholder="John Doe"
                />
              </div>

              {/* Bio */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Bio *</span>
                </label>
                <textarea
                  value={formState.bio}
                  onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                  className="textarea textarea-bordered h-24"
                  placeholder="Tell others about yourself and your language learning goals..."
                />
              </div>

              <div className="flex gap-3 justify-between pt-4">
                <button onClick={prevStep} className="btn btn-ghost gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button onClick={nextStep} className="btn btn-primary gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Languages */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Language Preferences</h2>
                <p className="text-base-content/60">Help us match you with the right partners</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">What's your native language? *</span>
                  </label>
                  <select
                    value={formState.nativeLanguage}
                    onChange={(e) => setFormState({ ...formState, nativeLanguage: e.target.value })}
                    className="select select-bordered select-lg"
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
                  <label className="label">
                    <span className="label-text font-medium">Which language are you learning? *</span>
                  </label>
                  <select
                    value={formState.learningLanguage}
                    onChange={(e) => setFormState({ ...formState, learningLanguage: e.target.value })}
                    className="select select-bordered select-lg"
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

              <div className="flex gap-3 justify-between pt-4">
                <button onClick={prevStep} className="btn btn-ghost gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button onClick={nextStep} className="btn btn-primary gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Location & Background */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Where are you from?</h2>
                <p className="text-base-content/60">This helps us connect you with nearby learners</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Location *</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 text-base-content/70" />
                    <input
                      type="text"
                      value={formState.location}
                      onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                      className="input input-bordered input-lg pl-10 w-full"
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Nationality *</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 text-base-content/70 pointer-events-none z-10" />
                    <select
                      value={formState.nationality}
                      onChange={(e) => setFormState({ ...formState, nationality: e.target.value })}
                      className="select select-bordered select-lg pl-10 w-full"
                    >
                      <option value="">Select your nationality</option>
                      {NATIONALITIES.map((nationality) => (
                        <option key={nationality} value={nationality.toLowerCase()}>
                          {nationality}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Profession</span>
                    <span className="label-text-alt text-base-content/50">Optional</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 text-base-content/70" />
                    <input
                      type="text"
                      value={formState.profession}
                      onChange={(e) => setFormState({ ...formState, profession: e.target.value })}
                      className="input input-bordered input-lg pl-10 w-full"
                      placeholder="e.g., Software Engineer, Teacher, Student"
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Phone Number</span>
                    <span className="label-text-alt text-base-content/50">Optional</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 text-base-content/70" />
                    <input
                      type="tel"
                      value={formState.phone}
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                      className="input input-bordered input-lg pl-10 w-full"
                      placeholder="+63 912 345 6789"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-between pt-4">
                <button onClick={prevStep} className="btn btn-ghost gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button onClick={nextStep} className="btn btn-primary gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Skills & Social */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Skills & Connect</h2>
                <p className="text-base-content/60">Optional - You can add these later</p>
              </div>

              {/* Skills */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Your Skills</span>
                  <span className="label-text-alt text-base-content/50">Optional</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    className="input input-bordered flex-1"
                    placeholder="Add a skill (e.g., JavaScript, Design)"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddSkill}
                    className="btn btn-primary"
                    disabled={!skillInput.trim()}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                {formState.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formState.skills.map((skill, index) => (
                      <div key={index} className="badge badge-primary gap-2 py-3 px-3">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-error"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Social Links</span>
                  <span className="label-text-alt text-base-content/50">Optional</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formState.twitter || ''}
                    onChange={(e) => setFormState({ ...formState, twitter: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="Twitter username (e.g., @johndoe)"
                  />
                  <input
                    type="text"
                    value={formState.linkedin || ''}
                    onChange={(e) => setFormState({ ...formState, linkedin: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="LinkedIn (e.g., linkedin.com/in/johndoe)"
                  />
                  <input
                    type="text"
                    value={formState.github || ''}
                    onChange={(e) => setFormState({ ...formState, github: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="GitHub username (e.g., @johndoe)"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-between pt-4">
                <button onClick={prevStep} className="btn btn-ghost gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button onClick={nextStep} className="btn btn-primary gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Review & Complete */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-success/20 p-4 rounded-full">
                    <Check className="w-12 h-12 text-success" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">You're all set! 🎉</h2>
                <p className="text-base-content/60">Review your profile and start connecting</p>
              </div>

              {/* Profile Summary */}
              <div className="bg-base-300 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={imagePreview || "/default-avatar.png"} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{formState.fullName}</h3>
                    <p className="text-sm text-base-content/60">{formState.location}</p>
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-base-content/60">Native</p>
                    <p className="font-medium capitalize">{formState.nativeLanguage}</p>
                  </div>
                  <div>
                    <p className="text-base-content/60">Learning</p>
                    <p className="font-medium capitalize">{formState.learningLanguage}</p>
                  </div>
                  <div>
                    <p className="text-base-content/60">Nationality</p>
                    <p className="font-medium capitalize">{formState.nationality}</p>
                  </div>
                  {formState.profession && (
                    <div>
                      <p className="text-base-content/60">Profession</p>
                      <p className="font-medium">{formState.profession}</p>
                    </div>
                  )}
                </div>

                {formState.skills.length > 0 && (
                  <>
                    <div className="divider my-2"></div>
                    <div>
                      <p className="text-base-content/60 text-sm mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {formState.skills.map((skill, i) => (
                          <span key={i} className="badge badge-primary">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 justify-between pt-4">
                <button onClick={prevStep} className="btn btn-ghost gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button 
                  onClick={handleSubmit} 
                  className="btn btn-primary btn-lg gap-2"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Complete Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;