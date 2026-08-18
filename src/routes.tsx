import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import HomePage from './pages/index';

// Lazy load components for code splitting (except HomePage for instant loading)
const NotFoundPage = lazy(() => import('./pages/_404'));
const ContactPage = lazy(() => import('./pages/contact'));
const LoginPage = lazy(() => import('./pages/login'));
const SignupPage = lazy(() => import('./pages/signup'));
const DashboardPage = lazy(() => import('./pages/dashboard'));
const EmergencyPage = lazy(() => import('./pages/emergency'));
const VoicePage = lazy(() => import('./pages/voice'));
const VaultPage = lazy(() => import('./pages/vault'));
const CommunityPage = lazy(() => import('./pages/community'));
const TrackingPage = lazy(() => import('./pages/tracking'));
const AssistantPage = lazy(() => import('./pages/assistant'));
const ContactsPage = lazy(() => import('./pages/contacts'));
const AdminPage = lazy(() => import('./pages/admin'));

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/emergency', element: <EmergencyPage /> },
  { path: '/voice', element: <VoicePage /> },
  { path: '/vault', element: <VaultPage /> },
  { path: '/community', element: <CommunityPage /> },
  { path: '/tracking', element: <TrackingPage /> },
  { path: '/assistant', element: <AssistantPage /> },
  { path: '/ai-assistant', element: <AssistantPage /> },
  { path: '/contacts', element: <ContactsPage /> },
  { path: '/admin', element: <AdminPage /> },
  { path: '*', element: <NotFoundPage /> },
];

// Types for type-safe navigation
export type Path =
  | '/'
  | '/contact'
  | '/login'
  | '/signup'
  | '/dashboard'
  | '/emergency'
  | '/voice'
  | '/vault'
  | '/community'
  | '/tracking'
  | '/assistant'
  | '/ai-assistant'
  | '/contacts'
  | '/admin';

export type Params = Record<string, string | undefined>;

