import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/authStore";

const Courses = lazy(() =>
  import("@/pages/Courses").then((module) => ({ default: module.Courses })),
);
const CourseDetail = lazy(() =>
  import("@/pages/CourseDetail").then((module) => ({
    default: module.CourseDetail,
  })),
);
const ForgotPassword = lazy(() =>
  import("@/pages/ForgotPassword").then((module) => ({
    default: module.ForgotPassword,
  })),
);
const ImportedSpaces = lazy(() =>
  import("@/pages/ImportedSpaces").then((module) => ({
    default: module.ImportedSpaces,
  })),
);
const ImportedSpaceDetail = lazy(() =>
  import("@/pages/ImportedSpaces").then((module) => ({
    default: module.ImportedSpaceDetail,
  })),
);
const Login = lazy(() =>
  import("@/pages/Login").then((module) => ({ default: module.Login })),
);
const Maintenance = lazy(() =>
  import("@/pages/Maintenance").then((module) => ({
    default: module.Maintenance,
  })),
);
const Unauthorized = lazy(() =>
  import("@/pages/Unauthorized").then((module) => ({
    default: module.Unauthorized,
  })),
);

function PageFallback() {
  return (
    <div className="repo-page-state">
      <span className="repo-spinner" />
      Cargando…
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const accessToken = useAuthStore((state) => state.tokens?.accessToken);
  if (isLoading) {
    return (
      <div className="repo-page-state">
        <span className="repo-spinner" />
        Verificando sesión…
      </div>
    );
  }
  return isAuthenticated && accessToken ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}

export function AppRouter() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.tokens?.accessToken);
  const backendUser = useAuthStore((state) => state.backendUser);
  const fetchUserPermissions = useAuthStore(
    (state) => state.fetchUserPermissions,
  );

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && accessToken && !backendUser)
      void fetchUserPermissions();
  }, [isAuthenticated, accessToken, backendUser, fetchUserPermissions]);

  const protectedPage = (page: React.ReactNode) => (
    <ProtectedRoute>{page}</ProtectedRoute>
  );

  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route element={<Layout />}>
            <Route path="/" element={protectedPage(<Courses />)} />
            <Route
              path="/courses/:offeringId"
              element={protectedPage(<CourseDetail />)}
            />
            <Route
              path="/maintenance"
              element={protectedPage(<Maintenance />)}
            />
            <Route
              path="/imported"
              element={protectedPage(<ImportedSpaces />)}
            />
            <Route
              path="/imported/:spaceId"
              element={protectedPage(<ImportedSpaceDetail />)}
            />
            <Route path="/library" element={<Navigate to="/" replace />} />
            <Route
              path="/course/:offeringId"
              element={<Navigate to="/" replace />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
