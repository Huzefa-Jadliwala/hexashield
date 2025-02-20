import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./app/store"; // Adjust the import path
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App"; // Import your App component
import DashboardPage from "@pages/DashboardPage";
import NotFoundPage from "@pages/NotFoundPage";
import ConversationListingPage from "@pages/ConversationListingPage";
import AgentListing from "@pages/AgentListing";
import TaskHistoryPage from "@pages/TaskHistoryPage";
import RegisterPage from "@pages/RegisterPage";
import RecoverPasswordPage from "@pages/RecoverPasswordPage";
import UserProfilePage from "@pages/UserProfilePage";
import { SocketProvider } from "context/SocketContext";
import WebhexReportListingPage from '@pages/WebhexReportListingPage';
import AutoReportListingPage from '@pages/AutoReportListingPage';
import ManualReportListingPage from '@pages/ManualReportListingPage';
import LoginPage from "@pages/LoginPage";
import { AuthContextProvider } from "context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "@pages/ResetPassword";


const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/conversations",
        element: (
          <ProtectedRoute>
            <ConversationListingPage />
          </ProtectedRoute>
        ),
        children: [
          {
            path: ":conversationId/:conversationType/:conversationStandard",
            element: (
              <ProtectedRoute>
                <ConversationListingPage />
              </ProtectedRoute>
            ),
          }
        ],
      },
      {
        path: "/agents",
        element: (
          <ProtectedRoute>
            <AgentListing />
          </ProtectedRoute>
        ),
        children: [
          {
            path: ":agentId",
            element: (
              <ProtectedRoute>
                <TaskHistoryPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "/webhex-reports",
        element: (
          <ProtectedRoute>
            <WebhexReportListingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/auto-reports",
        element: (
          <ProtectedRoute>
            <AutoReportListingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/manual-reports",
        element: (
          <ProtectedRoute>
            <ManualReportListingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/user-profile",
        element: (
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        ),
      },
    ],
    errorElement: <NotFoundPage />,
  },
  // Public routes - no ProtectedRoute wrapper
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/recover-password",
    element: <RecoverPasswordPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
    errorElement: <NotFoundPage />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SocketProvider>
      <AuthContextProvider>
        <Provider store={store}>
          <RouterProvider router={router} />
        </Provider>
      </AuthContextProvider>
    </SocketProvider>
  </StrictMode>
);
