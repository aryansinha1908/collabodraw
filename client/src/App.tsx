import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Auth } from "./components/Auth";
import { Home } from "./pages/Home";
import { BoardPage } from "./pages/BoardPage";
import { useBoardStore } from "./store";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useBoardStore();
  if (!token) return <Navigate to="/auth" />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />

        {/* UNPROTECTED: Anyone can view the home page now */}
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

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
