/**
 * Browser router — single source of truth for the app's route table.
 *
 * Layout route: AppShell renders chrome + <Outlet />. The four children render
 * inside the outlet. No loaders / actions yet; data-fetching belongs to Epic 2+.
 */

import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/app/AppShell'
import { DashboardRoute } from '@/routes/dashboard'
import { ExploreRoute } from '@/routes/explore'
import { NotFoundRoute } from '@/routes/not-found'
import { SettingsRoute } from '@/routes/settings'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardRoute /> },
      { path: 'explore', element: <ExploreRoute /> },
      { path: 'settings', element: <SettingsRoute /> },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
])
