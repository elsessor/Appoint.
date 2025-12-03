import { Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/Homepage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatsPage from "./pages/ChatsPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import AppointmentBookingPage from "./pages/AppointmentBookingPage.jsx";
import AppointmentsPage from "./pages/AppointmentsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import FriendsPage from "./pages/FriendsPage.jsx";
import MeetingMinutesPage from "./pages/MeetingMinutesPage.jsx";
import SettingPage from "./pages/SettingPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import FriendProfilePage from "./pages/FriendProfilePage.jsx";

import { Toaster } from "react-hot-toast";

import PageLoader from "./components/PageLoader.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";
import { useThemeStore } from "./store/useThemeStore.js";
import useRealtimeNotifications from "./hooks/useRealtimeNotifications.js";

const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;
  const isAdmin = authUser?.role === "admin";

  useRealtimeNotifications(isAuthenticated && isOnboarded && !isAdmin);

  if (isLoading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-base-100" data-theme={theme}>
      <Routes>
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <LandingPage />
            ) : !isOnboarded ? (
              <Navigate to="/onboarding" />
            ) : isAdmin ? (
              <Navigate to="/admin" />
            ) : (
              <Navigate to="/homepage" />
            )
          }
        />

        <Route path="/landing" element={<LandingPage />} />

        <Route
          path="/homepage"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <Layout showSidebar={true}>
                <HomePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/admin" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/friends"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <Layout showSidebar={true}>
                <FriendsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/admin" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/signup"
          element={!isAuthenticated ? <SignUpPage /> : <Navigate to={isAdmin ? "/admin" : isOnboarded ? "/homepage" : "/onboarding"} />}
        />

        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to={isAdmin ? "/admin" : isOnboarded ? "/homepage" : "/onboarding"} />}
        />

        <Route
          path="/notifications"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <Layout showSidebar={true}>
                <NotificationsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/admin" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/call/:id"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <CallPage />
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/admin" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/chats/:id"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <Layout showSidebar={false}>
                <ChatsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/admin" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/chats"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <ChatsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/booking"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <Layout showSidebar={true}>
                <AppointmentBookingPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/admin" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/appointments"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <Layout showSidebar={true}>
                <AppointmentsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/admin" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/onboarding"
          element={
            isAuthenticated ? (
              isAdmin ? (
                <Navigate to="/admin" />
              ) : !isOnboarded ? (
                <OnboardingPage />
              ) : (
                <Navigate to="/homepage" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/profile"
          element={
            isAuthenticated && !isAdmin ? (
              <Layout showSidebar>
                <ProfilePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/"} />
            )
          }
        />

        <Route
          path="/meeting-minutes"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar>
                <MeetingMinutesPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/settings"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <Layout showSidebar={true}>
                <SettingPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/admin" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/admin"
          element={
            isAuthenticated && isAdmin ? (
              <Layout showSidebar={true}>
                <AdminDashboard />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/"} />
            )
          }
        />

        <Route
          path="/profile/:id"
          element={
            isAuthenticated ? (
              <Layout showSidebar>
                <FriendProfilePage />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/call/:channelId"
          element={
            isAuthenticated && isOnboarded ? (
              <CallPage />
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/admin" : "/onboarding"} />
            )
          }
        />

      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
