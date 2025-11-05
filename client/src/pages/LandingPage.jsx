import { Link } from "react-router";
import { ShipWheelIcon, Calendar, Users, Bell, Clock, Headphones } from "lucide-react";

const Feature = ({ title, desc, Icon }) => (
  <div className="rounded-2xl bg-base-200 p-6 shadow-lg card-pop card-appear">
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
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
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="px-6 py-6 border-b border-gray-800 bg-base-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShipWheelIcon className="size-7 text-primary" />
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Appoint.</span>
          </div>
          <nav className="space-x-3">
            <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Get started</Link>
          </nav>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                Schedule meetings with ease.
              </h1>
              <p className="text-lg opacity-70 mb-6">Appoint. helps you manage appointments, book with friends, and keep your calendar organized — all in one beautiful, simple app.</p>

              <div className="flex items-center gap-3">
                <Link to="/signup" className="btn btn-primary">Create account</Link>
                <Link to="/landing" className="btn btn-outline">Learn more</Link>
              </div>
            </div>

            <div>
              <div className="rounded-2xl bg-base-200 p-6 shadow-2xl">
                <div className="h-56 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-lg flex items-center justify-center">
                  <img src="/Video call-rafiki.png" alt="Illustration" className="max-h-44" />
                </div>
                <div className="mt-4 text-sm opacity-70">See how easy it is to connect with language partners and schedule time.</div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-primary mb-6">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Feature Icon={Calendar} title="Simple Scheduling" desc="Create and manage appointments with a couple clicks." />
              <Feature Icon={Users} title="Language Partners" desc="Find language partners and coaches in your area or online." />
              <Feature Icon={Bell} title="Notifications" desc="Get reminders and status updates so you never miss a meeting." />
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-primary mb-6">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-base-200 p-4 shadow card-pop card-appear">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Quick Meeting</div>
                    <div className="text-xs opacity-70">15 minutes — perfect for quick check-ins</div>
                  </div>
                </div>
                <div className="mt-4"><Link to="/signup" className="btn btn-sm btn-primary">Book</Link></div>
              </div>

              <div className="rounded-2xl bg-base-200 p-4 shadow card-pop card-appear">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Team Sync</div>
                    <div className="text-xs opacity-70 mt-2">Coordinate across timezones with ease.</div>
                  </div>
                </div>
                <div className="mt-4"><Link to="/signup" className="btn btn-sm btn-outline">Details</Link></div>
              </div>

              <div className="rounded-2xl bg-base-200 p-4 shadow card-pop card-appear">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Private Coaching</div>
                    <div className="text-xs opacity-70 mt-2">Book one-on-one sessions with top instructors.</div>
                  </div>
                </div>
                <div className="mt-4"><Link to="/signup" className="btn btn-sm btn-primary">Book now</Link></div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-800 py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm opacity-70">
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
