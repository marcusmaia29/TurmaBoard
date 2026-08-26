import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./shared/AppShell";
import { LoadingSkeleton } from "./shared/feedback";
import { RealtimeProvider } from "./features/realtime/RealtimeSync";

const WeekPage = lazy(() => import("./features/deliveries/WeekPage"));
const CalendarPage = lazy(() => import("./features/calendar/CalendarPage"));
const SubjectsPage = lazy(() => import("./features/subjects/SubjectsPage"));
const HistoryPage = lazy(() => import("./features/history/HistoryPage"));
const GradePage = lazy(() => import("./features/grade/GradePage"));
const AboutPage = lazy(() => import("./features/about/AboutPage"));
const LoginPage = lazy(() => import("./features/auth/LoginPage"));

export default function App() {
  return (
    <RealtimeProvider>
      <Suspense fallback={<main className="app-main"><LoadingSkeleton /></main>}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/week" element={<WeekPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/grade" element={<GradePage />} />
            <Route path="/about" element={<AboutPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/week" replace />} />
          <Route path="*" element={<Navigate to="/week" replace />} />
        </Routes>
      </Suspense>
    </RealtimeProvider>
  );
}
