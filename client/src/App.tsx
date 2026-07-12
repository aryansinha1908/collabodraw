import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Auth } from "./components/Auth";
import { Home } from "./pages/Home";
import { BoardPage } from "./pages/BoardPage";
import { Dashboard } from "./pages/Dashboard";
import { useBoardStore } from "./store";
import { Loader2 } from "lucide-react";

// 1. ProtectedRoute to use the boolean state
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useBoardStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

// 2. AuthRoute to prevent logged-in users from seeing the login screen
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useBoardStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  // Only pull what we need from the global store
  const { isCheckingAuth, checkAuth } = useBoardStore();

  // 3. Fire the cookie validation exactly once when the app mounts
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 4. Hold off rendering the router until we know if they have a valid cookie
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  // 5. Your fully protected router structure
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            <AuthRoute>
              <Auth />
            </AuthRoute>
          }
        />
        <Route path="/" element={<Home />} />
        <Route
          path="/board/:roomId"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
