import { Navigate, Route, Routes } from "react-router";

import HomePage from "./pages/Homepage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import AppointmentBookingPage from "./pages/AppointmentBookingPage.jsx";
import AppointmentsPage from "./pages/AppointmentsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingPage from "./pages/SettingPage.jsx";
import FriendsPage from "./pages/FriendsPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

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
            isAuthenticated ? (
              isAdmin ? (
                <Layout showSidebar={true}>
                  <AdminDashboard />
                </Layout>
              ) : isOnboarded ? (
                <Layout showSidebar={true}>
                  <HomePage />
                </Layout>
              ) : (
                <Navigate to="/onboarding" />
              )
            ) : (
              <LandingPage />
            )
          }
        />
        <Route path="/landing" element={<LandingPage />} />
        <Route
          path="/friends"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <Layout showSidebar={true}>
                <FriendsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            !isAuthenticated ? (
              <SignUpPage />
            ) : (
              <Navigate to={isAdmin ? "/" : isOnboarded ? "/" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <LoginPage />
            ) : (
              <Navigate to={isAdmin ? "/" : isOnboarded ? "/" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/notifications"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <Layout showSidebar={true}>
                <NotificationsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/call/:id"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <CallPage />
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/chat/:id"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <Layout showSidebar={false}>
                <ChatPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/" : "/onboarding"} />
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
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/" : "/onboarding"} />
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
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/onboarding"
          element={
            isAuthenticated ? (
              isAdmin ? (
                <Navigate to="/" />
              ) : !isOnboarded ? (
                <OnboardingPage />
              ) : (
                <Navigate to="/" />
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
          path="/settings"
          element={
            isAuthenticated && isOnboarded && !isAdmin ? (
              <Layout showSidebar={true}>
                <SettingPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/" : "/onboarding"} />
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
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
