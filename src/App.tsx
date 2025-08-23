import { lazy, Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ConditionalHeader } from './components/layout/ConditionalHeader';
import { Footer } from './components/layout/Footer';
import { WaveBackground } from './components/layout/WaveBackground';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import {
  AppProvider,
  AuthProvider,
  DataProvider,
  TaskProvider,
} from './contexts';
import './lib/i18n'; // i18n 초기화

// Lazy load pages for code splitting
const TodoHome = lazy(() => import('./pages/TodoHome'));
const TaskCreate = lazy(() => import('./pages/TaskCreate'));
const TaskDetailPage = lazy(() => import('./pages/TaskDetailPage'));
const FamilyManage = lazy(() => import('./pages/FamilyManage'));
const PointsManagement = lazy(() => import('./pages/PointsManagement'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Login = lazy(() => import('./pages/Login'));
const AboutUs = lazy(() => import('./components/pages/AboutUs'));
const TermsOfService = lazy(() => import('./components/pages/TermsOfService'));
const ProjectDetail = lazy(() => import('./components/pages/ProjectDetail'));
const NotFound = lazy(() => import('./components/routing/NotFound'));

// Loading component with Moonwave style
const LoadingFallback = () => (
  <div className="min-h-screen">
    <WaveBackground />
    <div className="relative z-10 flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" variant="wave" text="페이지를 불러오는 중..." />
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <AppProvider>
            <TaskProvider>
              <Router
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <div className="min-h-screen relative">
                  <WaveBackground />

                  {/* Conditional Header */}
                  <ConditionalHeader />

                  <div className="relative z-10 min-h-screen flex flex-col">
                    <div className="flex-1">
                      <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                          {/* Public routes */}
                          <Route
                            path="/login"
                            element={
                              <ProtectedRoute requireAuth={false}>
                                <Login />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="/about" element={<AboutUs />} />
                          <Route
                            path="/terms-of-service"
                            element={<TermsOfService />}
                          />
                          <Route
                            path="/project-detail/:projectId"
                            element={<ProjectDetail />}
                          />

                          {/* Protected routes - Todo App */}
                          <Route
                            path="/"
                            element={
                              <ProtectedRoute>
                                <TodoHome />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/todo"
                            element={
                              <ProtectedRoute>
                                <TodoHome />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/tasks/create"
                            element={
                              <ProtectedRoute>
                                <TaskCreate mode="create" />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/tasks/:taskId/edit"
                            element={
                              <ProtectedRoute>
                                <TaskCreate mode="edit" />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/tasks/:taskId"
                            element={
                              <ProtectedRoute>
                                <TaskDetailPage />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/family"
                            element={
                              <ProtectedRoute>
                                <FamilyManage />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/points"
                            element={
                              <ProtectedRoute>
                                <PointsManagement />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/statistics"
                            element={
                              <ProtectedRoute>
                                <Statistics />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/settings"
                            element={
                              <ProtectedRoute>
                                <Settings />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/notifications"
                            element={
                              <ProtectedRoute>
                                <Notifications />
                              </ProtectedRoute>
                            }
                          />

                          {/* Legacy routes removed - focusing on task management only */}

                          {/* 404 route */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </div>

                    {/* Footer */}
                    <Footer />
                  </div>
                </div>
              </Router>
            </TaskProvider>
          </AppProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
