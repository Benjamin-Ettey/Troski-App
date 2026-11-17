import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Everything inside here requires a signed-in admin */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Overview />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;