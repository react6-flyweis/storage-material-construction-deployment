import { lazy } from "react";
import { Route, Routes, Outlet } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Layout from "../app/layout";
import ErrorBoundary, { RouterErrorFallback } from "../pages/ErrorPage";

// Lazy loaded page components
const Dashboard = lazy(() => import("../app/Dashboard"));
const Projects = lazy(() => import("../app/Projects"));
const Tasks = lazy(() => import("../app/Tasks"));
const Materials = lazy(() => import("../app/Materials"));
const Reports = lazy(() => import("../app/Reports"));
const Communication = lazy(() => import("../app/Communication"));
const Notifications = lazy(() => import("../app/Notifications"));
const MaterialsViewPage = lazy(() => import("../app/MaterialsViewPage"));
const ProjectViewPage = lazy(() => import("../app/ProjectViewPage"));
const DrawingAttachment = lazy(() => import("../app/DrawingAttachment"));
const Login = lazy(() => import("../components/home/login"));
const ProfilePage = lazy(() => import("../app/Profile"));
const SettingPage = lazy(() => import("../app/Settings"));
const ForgotPassword = lazy(() => import("../components/home/forgotpassword"));
const ResetPassword = lazy(() => import("../components/home/resetpassword"));
const DeliveryTracking = lazy(() => import("../app/DeliveryTracking"));
const LoadStaging = lazy(() => import("../app/LoadStaging"));
const BundleScan = lazy(() => import("../app/BundleScan"));
const LabelPrinting = lazy(() => import("../app/LabelPrinting"));
const PackingLists = lazy(() => import("../app/PackingLists"));
const DispatchVerification = lazy(() => import("../app/DispatchVerification"));
const NotFound = lazy(() =>
  import("../pages/NotFound").then((module) => ({ default: module.NotFound }))
);

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route errorElement={<RouterErrorFallback />}>
          <Route element={<PublicRoute />}>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route
              element={
                <Layout>
                  <Outlet />
                </Layout>
              }
            >
              <Route path="/settings" element={<SettingPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/project-view-page" element={<ProjectViewPage />} />
              <Route path="/drawing-attachment" element={<DrawingAttachment />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/material-view-page" element={<MaterialsViewPage />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/communication" element={<Communication />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/delivery-tracking" element={<DeliveryTracking />} />
              <Route path="/delivery-tracking/load-staging" element={<LoadStaging />} />
              <Route path="/delivery-tracking/bundle-scan" element={<BundleScan />} />
              <Route path="/delivery-tracking/label-printing" element={<LabelPrinting />} />
              <Route path="/delivery-tracking/packing-lists" element={<PackingLists />} />
              <Route path="/delivery-tracking/dispatch-verification" element={<DispatchVerification />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

export default AppRoutes;
