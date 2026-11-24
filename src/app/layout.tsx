import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import Header from "../components/header/Header";
import { SearchProvider } from "../context/SearchContext";
import { WelcomeTourDialog } from "../modules/tour/components/welcome-tour-dialog";
import { tourCoordinator } from "../modules/tour/tour.service";
import { useTourStore } from "../modules/tour/tour.store";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isTourRunning = useTourStore((s) => s.activeTourId !== null);

  const isAuthPage = ["/", "/login", "/register", "/forgot-password"].includes(
    location.pathname
  );

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    tourCoordinator.init(navigate);
  }, [navigate]);

  // Leaving the panel (e.g. signing out) ends the walkthrough.
  useEffect(() => () => tourCoordinator.stopTour(), []);

  // The walkthrough points at the sub-tabs, so they can't be collapsed.
  const isPanelHidden = isPanelCollapsed && !isTourRunning;

  const togglePanel = () => setIsPanelCollapsed((prev) => !prev);

  return (
    <div className="flex min-h-screen bg-[#E5ECFF]">
      {!isAuthPage && <WelcomeTourDialog />}
      {!isAuthPage && (
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          isCollapsed={isPanelHidden}
        />
      )}
      <SearchProvider>
        <div className="flex flex-1 flex-col min-w-0 transition-all duration-300">
          {!isAuthPage && (
            <Header
              onToggleSidebar={() => setSidebarOpen((p) => !p)}
              isPanelCollapsed={isPanelHidden}
              onPanelToggle={togglePanel}
            />
          )}

          <main data-tour="page-content" className={`${isAuthPage ? "h-svh" : "h-[calc(100vh-81px)] lg:px-8 px-4 py-6"} overflow-auto `}>
            {children}
          </main>
        </div>
      </SearchProvider>
    </div>
  );
}

