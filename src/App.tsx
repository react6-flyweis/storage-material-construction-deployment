import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { SidebarProvider } from "./context/SidebarContext";
import { SocketProvider } from "./context/SocketContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import LoadingScreen from "./components/LoadingScreen";

const queryClient =
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  })

function App() {

  return (
    <Suspense fallback={<LoadingScreen />}>

      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
              }}
            />
            <SidebarProvider>
              <AppRoutes />
            </SidebarProvider>
          </BrowserRouter>
        </SocketProvider>
      </QueryClientProvider>
    </Suspense>
  );
}

export default App;
