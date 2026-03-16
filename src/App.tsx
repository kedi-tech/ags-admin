import { Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import Login from "./components/auth/Login";
import { getCurrentUser } from "./api/auth";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const check = async () => {
      try {
        await getCurrentUser();
        if (!cancelled) {
          setAuthorized(true);
        }
      } catch {
        if (!cancelled) {
          // Token invalid or backend unreachable: force logout
          try {
            localStorage.removeItem("token");
            localStorage.removeItem("session");
            localStorage.removeItem("name");
            localStorage.removeItem("email");
            localStorage.removeItem("role");
          } catch {
            // ignore storage errors
          }
          setAuthorized(false);
        }
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (authorized === null) {
    return <p>Vérification de la session...</p>;
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RedirectIfAuthenticated = ({ children }: { children: JSX.Element }) => {
  return children;
};

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <Login />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/products"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/categories"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/subcategories"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/customers"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/credit"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/payments"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/users"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/stock"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    </Suspense>
  );
}

export default App;
