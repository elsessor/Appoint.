import { Routes, Route, Navigate, BrowserRouter } from "react-router";

import HomePage from "./pages/Homepage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

import { Toaster } from "react-hot-toast";
import PageLoader from "./components/PageLoader.jsx";
import Layout from "./components/Layout.jsx";
import { getAuthUser } from "./lib/api.js";
import useAuthUser from "./hooks/useAuthUser.js";

const App = () => {

  const {isLoading, authUser} = useAuthUser();

  if (isLoading) return <PageLoader />;

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;

  return <div className="h-screen" data-theme="night">
      <Routes>
        {/* root: always redirect to signup (dev convenience) */}
        <Route path="/" element={<Navigate to="/signup" replace />} />

        {/* homepage moved to /homepage */}
        <Route
          path="/homepage"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar>{<HomePage />}</Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/signup" : "/onboarding"} />
            )
          }
        />
  {/* Always allow visiting signup/login even when authenticated (dev requirement) */}
  <Route path="/signup" element={<SignUpPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/notifications" element={isAuthenticated ? <Layout showSidebar><NotificationsPage /></Layout> : <Navigate to="/login" />} />
  <Route path="/call/:id" element={
    isAuthenticated && isOnboarded ? (
      <CallPage/>
    ) : (
    <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
    )
    } />

  <Route path="/chat/:id"
           element={
          isAuthenticated && isOnboarded  ? (
            <Layout showSidebar={false}>
              <ChatPage />
              </Layout>
          ) : (
            <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
          )
        }
         />
        <Route
          path="/onboarding"
          element={
            isAuthenticated ? (!isOnboarded ? <OnboardingPage /> : <Navigate to="/homepage" />) : <Navigate to="/login" />
          }
        />
      </Routes>

    <Toaster />
  </div>;
};
export default App;