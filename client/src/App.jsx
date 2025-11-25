import { Navigate, Route, Routes } from "react-router";

import HomePage from "./pages/Homepage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import FriendsPage from "./pages/FriendsPage.jsx"; 
import MeetingMinutesPage from "./pages/MeetingMinutesPage.jsx";
import ChatsPage from "./pages/ChatsPage.jsx";

import { Toaster } from "react-hot-toast";

import PageLoader from "./components/PageLoader.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";
import { useThemeStore } from "./store/useThemeStore.js";

const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;

  if (isLoading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-base-100" data-theme={theme}>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <HomePage />
              </Layout>
            ) : !isAuthenticated ? (
              <LandingPage />
            ) : (
              <Navigate to="/onboarding" />
            )
          }
        />
        <Route path="/landing" element={<LandingPage />} />
        <Route
          path="/friends"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <FriendsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            !isAuthenticated ? <SignUpPage /> : <Navigate to={isOnboarded ? "/" : "/onboarding"} />
          }
        />
        <Route
          path="/login"
          element={
            !isAuthenticated ? <LoginPage /> : <Navigate to={isOnboarded ? "/" : "/onboarding"} />
          }
        />
        <Route
          path="/notifications"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <NotificationsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
<Route
  path="/chats"
  element={
    isAuthenticated && isOnboarded ? (
      <Layout showSidebar={true}>  {/* ✅ Change to true */}
        <ChatsPage />
      </Layout>
    ) : (
      <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
    )
  }
/>
<Route
  path="/chats/:id"
  element={
    isAuthenticated && isOnboarded ? (
      <Layout showSidebar={true}>  {/* ✅ Change to true */}
        <ChatsPage />
      </Layout>
    ) : (
      <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
    )
  }
/>

        <Route
          path="/onboarding"
          element={
            isAuthenticated ? (
              !isOnboarded ? (
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
            isAuthenticated ? (
              <Layout showSidebar>
                <ProfilePage />
              </Layout>
            ) : (
              <Navigate to="/login" />
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
        
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;