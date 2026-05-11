import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppShell } from "./components/layout/AppShell";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/DashboardView";
import Scanner from "./pages/Scanner";
import ScanDetail from "./pages/ScanDetail";
import ThreatLab from "./pages/ThreatLab";
import Feed from "./pages/Feed";

function Protected({ children }: { children: React.ReactElement }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-night-950 text-slate-400">
        Authenticating…
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }: { children: React.ReactElement }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-night-950 text-slate-400">
        Loading…
      </div>
    );
  }
  if (token) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="scanner" element={<Scanner />} />
        <Route path="scans/:id" element={<ScanDetail />} />
        <Route path="lab" element={<ThreatLab />} />
        <Route path="feed" element={<Feed />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
