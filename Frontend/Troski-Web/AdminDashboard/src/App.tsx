import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Everything inside here requires a signed-in admin */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Overview />} />
              <Route
                path="/applications"
                element={<Placeholder description="The applications list with search and filters comes next." />}
              />
              <Route
                path="/drivers"
                element={<Placeholder description="Approved drivers, their status and history will live here." />}
              />
              <Route
                path="/audit-logs"
                element={<Placeholder description="A record of admin activity will show here." />}
              />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;