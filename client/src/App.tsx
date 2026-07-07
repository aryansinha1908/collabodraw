import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Auth } from "./components/Auth";
import { Home } from "./pages/Home";
import { BoardPage } from "./pages/BoardPage";
import { Dashboard } from "./pages/Dashboard";
import { useBoardStore } from "./store";
import { Loader2 } from "lucide-react"; // Or however you prefer to show a spinner

const API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

// 1. Updated ProtectedRoute to use the new boolean state
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useBoardStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

// 2. Added an AuthRoute to prevent logged-in users from seeing the login screen
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useBoardStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  const { setAuth } = useBoardStore();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // 3. The Cookie Validation Logic runs once when the app mounts
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          credentials: "include", // CRITICAL: Sends the cookie
        });

        if (res.ok) {
          const data = await res.json();
          setAuth(true, data.username);
        } else {
          setAuth(false, null);
        }
      } catch (err) {
        setAuth(false, null);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [setAuth]);

  // 4. Hold off rendering the router until we know if they have a valid cookie
  if (isCheckingSession) {
    return (
      <div className="h-screen w-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  // 5. Your original router structure is fully restored!
  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH: Guarded so logged-in users bypass it */}
        <Route
          path="/auth"
          element={
            <AuthRoute>
              <Auth />
            </AuthRoute>
          }
        />

        {/* UNPROTECTED: Anyone can view the home page */}
        <Route path="/" element={<Home />} />

        {/* PROTECTED: Must be logged in to view a board */}
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

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
