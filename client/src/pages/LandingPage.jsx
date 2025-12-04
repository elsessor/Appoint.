import { Link } from "react-router";
import { ShipWheelIcon, Calendar, Users, Bell, Zap, Target, Shield, CheckCircle, ArrowRight } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import ThemeSelector from "../components/ThemeSelector";
import { useEffect, useRef, useState } from "react";

const Feature = ({ title, desc, Icon }) => (
  <div className="rounded-2xl bg-base-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in">
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div>
        <h3 className="font-semibold text-lg text-primary mb-2">{title}</h3>
        <p className="text-sm opacity-70">{desc}</p>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const { theme } = useThemeStore();
  const elementsRef = useRef([]);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Function to calculate animation progress for an element
  const getElementProgress = (element) => {
    if (!element) return 0;
    
    const rect = element.getBoundingClientRect();
    const elementTop = rect.top;
    const windowHeight = window.innerHeight;
    
    // Start animation when element is 80% down the viewport
    const triggerPoint = windowHeight * 0.8;
    const distanceFromTrigger = triggerPoint - elementTop;
    const maxDistance = windowHeight * 0.6;
    
    // Progress from 0 to 1
    return Math.max(0, Math.min(1, distanceFromTrigger / maxDistance));
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content overflow-hidden" data-theme={theme}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(80px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-fade-in { 
          animation: fadeInUp 1s ease-out forwards !important; 
        }
        .animate-slide-in-left { 
          animation: slideInLeft 0.6s ease-out forwards !important; 
        }
        .animate-slide-in-right { 
          animation: slideInRight 0.6s ease-out forwards !important; 
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .scroll-animate { opacity: 1; }
        .scroll-animate-item {
          transition: opacity 0.3s ease-out, transform 0.3s ease-out;
        }
      `}</style>

      <header className="px-6 py-6 border-b border-base-300 bg-base-100/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <ShipWheelIcon className="size-7 text-primary" />
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Appoint.</span>
          </div>
          <nav className="flex items-center gap-4">
            <ThemeSelector />
            <Link to="/login" className="btn btn-ghost btn-sm hover:animate-pulse">Sign in</Link>
            <Link to="/signup" className="btn btn-primary btn-sm transition-all hover:shadow-lg">Get started</Link>
          </nav>
        </div>
      </header>

      <main className="bg-gradient-to-b from-base-100 via-base-100 to-primary/5">
        {/* Hero Section */}
        <div className="py-20 px-6 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-50 animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl opacity-50 animate-float" style={{ animationDelay: '1s' }}></div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-slide-in-left">
                <div className="inline-block">
                  <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">Smart Appointment Management</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
                  Schedule with <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">anyone, anytime</span>
                </h1>
                <p className="text-lg opacity-70 leading-relaxed">
                  Appoint. streamlines appointment scheduling and calendar management for seamless coordination with colleagues, partners, and associates. Optimize your time with our comprehensive and intuitive platform.
                </p>
                
                <div className="flex flex-wrap gap-4 pt-4">
                  <Link to="/signup" className="btn btn-primary btn-lg gap-2 transition-all hover:shadow-lg hover:-translate-y-1">
                    Get Started <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link to="/landing" className="btn btn-outline btn-lg transition-all hover:shadow-lg">Learn More</Link>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 pt-8">
                  <div className="space-y-1 group cursor-pointer">
                    <p className="text-2xl font-bold text-primary group-hover:text-secondary transition-colors">10k+</p>
                    <p className="text-sm opacity-60 group-hover:opacity-100 transition-opacity">Active Users</p>
                  </div>
                  <div className="space-y-1 group cursor-pointer">
                    <p className="text-2xl font-bold text-primary group-hover:text-secondary transition-colors">50k+</p>
                    <p className="text-sm opacity-60 group-hover:opacity-100 transition-opacity">Meetings Booked</p>
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              <div className="relative animate-slide-in-right">
                <div className="rounded-3xl bg-gradient-to-br from-primary/20 via-base-200 to-secondary/20 p-8 shadow-2xl border border-primary/10 hover:shadow-3xl transition-all duration-300">
                  <div className="h-80 bg-gradient-to-br from-primary/30 to-secondary/20 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img src="/Video call-rafiki.png" alt="People scheduling meetings" className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-6 space-y-2 text-sm opacity-70">
                    <div className="flex items-center gap-2 hover:translate-x-1 transition-transform">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <span>One-click booking</span>
                    </div>
                    <div className="flex items-center gap-2 hover:translate-x-1 transition-transform">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <span>Real-time updates</span>
                    </div>
                    <div className="flex items-center gap-2 hover:translate-x-1 transition-transform">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <span>Smart reminders</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 px-6 bg-base-100/50" ref={el => elementsRef.current.push(el)}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl font-bold mb-4">Why Choose Appoint.</h2>
              <p className="text-lg opacity-70 max-w-2xl mx-auto">Comprehensive tools designed to enhance productivity and streamline professional scheduling</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                ref={el => elementsRef.current[0] = el}
                className="group rounded-2xl bg-gradient-to-br from-base-200 to-base-300 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 hover:-translate-y-2 scroll-animate-item"
                style={{
                  opacity: getElementProgress(elementsRef.current[0]),
                  transform: `translateY(${Math.max(0, 40 - getElementProgress(elementsRef.current[0]) * 40)}px)`
                }}
              >
                <Feature Icon={Calendar} title="Instant Booking" desc="Book appointments with friends in seconds, no back-and-forth needed." />
              </div>
              <div 
                ref={el => elementsRef.current[1] = el}
                className="group rounded-2xl bg-gradient-to-br from-base-200 to-base-300 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 hover:-translate-y-2 scroll-animate-item"
                style={{
                  opacity: getElementProgress(elementsRef.current[1]),
                  transform: `translateY(${Math.max(0, 40 - getElementProgress(elementsRef.current[1]) * 40)}px)`
                }}
              >
                <Feature Icon={Users} title="Connect With Friends" desc="Build your network and schedule hangouts with people who matter to you." />
              </div>
              <div 
                ref={el => elementsRef.current[2] = el}
                className="group rounded-2xl bg-gradient-to-br from-base-200 to-base-300 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 hover:-translate-y-2 scroll-animate-item"
                style={{
                  opacity: getElementProgress(elementsRef.current[2]),
                  transform: `translateY(${Math.max(0, 40 - getElementProgress(elementsRef.current[2]) * 40)}px)`
                }}
              >
                <Feature Icon={Bell} title="Never Forget" desc="Get smart reminders so you never miss plans with your friends." />
              </div>
              <div 
                ref={el => elementsRef.current[3] = el}
                className="group rounded-2xl bg-gradient-to-br from-base-200 to-base-300 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 hover:-translate-y-2 scroll-animate-item"
                style={{
                  opacity: getElementProgress(elementsRef.current[3]),
                  transform: `translateY(${Math.max(0, 40 - getElementProgress(elementsRef.current[3]) * 40)}px)`
                }}
              >
                <Feature Icon={Zap} title="Super Fast" desc="Our streamlined interface makes scheduling effortless and lightning quick." />
              </div>
              <div 
                ref={el => elementsRef.current[4] = el}
                className="group rounded-2xl bg-gradient-to-br from-base-200 to-base-300 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 hover:-translate-y-2 scroll-animate-item"
                style={{
                  opacity: getElementProgress(elementsRef.current[4]),
                  transform: `translateY(${Math.max(0, 40 - getElementProgress(elementsRef.current[4]) * 40)}px)`
                }}
              >
                <Feature Icon={Shield} title="Your Privacy First" desc="Your personal data is protected with enterprise-grade security and privacy." />
              </div>
              <div 
                ref={el => elementsRef.current[5] = el}
                className="group rounded-2xl bg-gradient-to-br from-base-200 to-base-300 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 hover:-translate-y-2 scroll-animate-item"
                style={{
                  opacity: getElementProgress(elementsRef.current[5]),
                  transform: `translateY(${Math.max(0, 40 - getElementProgress(elementsRef.current[5]) * 40)}px)`
                }}
              >
                <Feature Icon={Target} title="Stay Organized" desc="Keep track of all your plans in one beautiful, organized calendar." />
              </div>
            </div>
          </div>
        </div>

        {/* Service Cards Section */}
        <div className="py-20 px-6" ref={el => elementsRef.current.push(el)}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl font-bold mb-4">How Appoint. Works</h2>
              <p className="text-lg opacity-70">Perfect for any occasion</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                ref={el => elementsRef.current[6] = el}
                className="group rounded-2xl bg-gradient-to-br from-base-200 to-base-300 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 hover:-translate-y-2 scroll-animate-item"
                style={{
                  opacity: getElementProgress(elementsRef.current[6]),
                  transform: `translateY(${Math.max(0, 40 - getElementProgress(elementsRef.current[6]) * 40)}px)`
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">Flexible Meetings</h3>
                </div>
                <p className="text-sm opacity-70 mb-4">Schedule casual hangouts or formal meetings effortlessly.</p>
                <ul className="space-y-2 text-sm mb-6">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0" /> Flexible availability</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0" /> Location sharing</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0" /> Calendar sync</li>
                </ul>
                <Link to="/signup" className="btn btn-sm btn-primary w-full transition-all hover:shadow-lg">Get Started</Link>
              </div>

              <div 
                ref={el => elementsRef.current[7] = el}
                className="group rounded-2xl bg-gradient-to-br from-base-200 to-base-300 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 hover:-translate-y-2 scroll-animate-item"
                style={{
                  opacity: getElementProgress(elementsRef.current[7]),
                  transform: `translateY(${Math.max(0, 40 - getElementProgress(elementsRef.current[7]) * 40)}px)`
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-secondary/10 text-secondary group-hover:bg-secondary/20 transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">Connect & Share</h3>
                </div>
                <p className="text-sm opacity-70 mb-4">Find and meet new people with similar interests and passions.</p>
                <ul className="space-y-2 text-sm mb-6">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0" /> Easy discovery</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0" /> Verified profiles</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0" /> Safe networking</li>
                </ul>
                <Link to="/signup" className="btn btn-sm btn-secondary w-full transition-all hover:shadow-lg">Join Now</Link>
              </div>

              <div 
                ref={el => elementsRef.current[8] = el}
                className="group rounded-2xl bg-gradient-to-br from-base-200 to-base-300 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 hover:-translate-y-2 scroll-animate-item"
                style={{
                  opacity: getElementProgress(elementsRef.current[8]),
                  transform: `translateY(${Math.max(0, 40 - getElementProgress(elementsRef.current[8]) * 40)}px)`
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">One-On-One Time</h3>
                </div>
                <p className="text-sm opacity-70 mb-4">Schedule personal meetings, consultations, or quality time easily.</p>
                <ul className="space-y-2 text-sm mb-6">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0" /> Flexible timing</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0" /> Personal notes</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0" /> Follow-ups easy</li>
                </ul>
                <Link to="/signup" className="btn btn-sm btn-accent w-full transition-all hover:shadow-lg">Book Now</Link>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 px-6 bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10" ref={el => elementsRef.current.push(el)}>
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold">Ready to schedule your next moment?</h2>
              <p className="text-lg opacity-70">Join thousands already using Appoint. to organize their time and stay connected.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="btn btn-primary btn-lg gap-2 transition-all hover:shadow-lg hover:-translate-y-1">
                Start Free Today <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg transition-all hover:shadow-lg">Already have an account?</Link>
            </div>
            <p className="text-sm opacity-50">No credit card required • Free plan available • Cancel anytime</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-base-300 py-8 bg-base-100">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm opacity-70 animate-fade-in">
          <p>&copy; 2024 Appoint. All rights reserved. • Built for better connections</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
