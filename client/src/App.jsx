import { Routes, Route, Navigate, BrowserRouter } from "react-router";

import ProfileDashboardPage from "./pages/ProfileDashboardPage.jsx";

import { Toaster } from "react-hot-toast";

const App = () => {

  return <div className="h-screen" data-theme="night">
      <Routes>
        <Route path="/profile" element={<ProfileDashboardPage />} />
        <Route path="/" element={<Navigate to="/profile" />} />
      </Routes>

    <Toaster />
  </div>;
};
export default App;