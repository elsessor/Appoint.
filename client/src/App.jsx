import { Routes, Route, Navigate, BrowserRouter } from "react-router";

import NotificationsPage from "./pages/NotificationsPage.jsx";

import { Toaster } from "react-hot-toast";

const App = () => {

  return <div className="h-screen" data-theme="night">
      <Routes>
        <Route path = "/notifications" element = {<NotificationsPage />} />
        <Route path = "/" element = {<Navigate to="/notifications" />} />
      </Routes>

    <Toaster />
  </div>;
};
export default App;