import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { RequireAdmin } from '@/components/admin/RequireAdmin'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { SiteDataProvider } from '@/hooks/useSiteData'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/hooks/useToast'
import { Spinner } from '@/components/ui'
import Home from '@/pages/Home'

/* Public pages are code-split so the homepage ships the smallest bundle. */
const About = lazy(() => import('@/pages/About'))
const Projects = lazy(() => import('@/pages/Projects'))
const ProjectDetails = lazy(() => import('@/pages/ProjectDetails'))
const Diagnostics = lazy(() => import('@/pages/Diagnostics'))
const DiagnosticDetails = lazy(() => import('@/pages/DiagnosticDetails'))
const Videos = lazy(() => import('@/pages/Videos'))
const VideoDetails = lazy(() => import('@/pages/VideoDetails'))
const Gallery = lazy(() => import('@/pages/Gallery'))
const Skills = lazy(() => import('@/pages/Skills'))
const Certificates = lazy(() => import('@/pages/Certificates'))
const CertificateDetails = lazy(() => import('@/pages/CertificateDetails'))
const CV = lazy(() => import('@/pages/CV'))
const Contact = lazy(() => import('@/pages/Contact'))
const NotFound = lazy(() => import('@/pages/NotFound'))

/* Admin pages are only downloaded by an authenticated administrator. */
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'))
const AdminResetPassword = lazy(() => import('@/pages/admin/AdminResetPassword'))
const Overview = lazy(() => import('@/pages/admin/Overview'))
const AdminProfile = lazy(() => import('@/pages/admin/AdminProfile'))
const AdminAbout = lazy(() => import('@/pages/admin/AdminAbout'))
const AdminProjects = lazy(() => import('@/pages/admin/AdminProjects'))
const AdminDiagnostics = lazy(() => import('@/pages/admin/AdminDiagnostics'))
const AdminVideos = lazy(() => import('@/pages/admin/AdminVideos'))
const AdminGallery = lazy(() => import('@/pages/admin/AdminGallery'))
const AdminSkills = lazy(() => import('@/pages/admin/AdminSkills'))
const AdminCertificates = lazy(() => import('@/pages/admin/AdminCertificates'))
const AdminCV = lazy(() => import('@/pages/admin/AdminCV'))
const AdminMessages = lazy(() => import('@/pages/admin/AdminMessages'))
const AdminSeo = lazy(() => import('@/pages/admin/AdminSeo'))
const AdminSocial = lazy(() => import('@/pages/admin/AdminSocial'))
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'))

function AdminFallback() {
  return (
    <div className="grid min-h-[60dvh] place-items-center">
      <Spinner className="h-6 w-6 text-signal-400" />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SiteDataProvider>
          <Routes>
            {/* Public site */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:slug" element={<ProjectDetails />} />
              <Route path="/diagnostics" element={<Diagnostics />} />
              <Route path="/diagnostics/:slug" element={<DiagnosticDetails />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/videos/:videoId" element={<VideoDetails />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/certificates/:slug" element={<CertificateDetails />} />
              <Route path="/cv" element={<CV />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin authentication */}
            <Route
              path="/admin"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminLogin />
                </Suspense>
              }
            />
            <Route
              path="/admin/reset-password"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminResetPassword />
                </Suspense>
              }
            />

            {/* Protected dashboard — /admin is the login, /admin/dashboard is the hub */}
            <Route
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              {[
                ['/admin/dashboard', Overview],
                ['/admin/profile', AdminProfile],
                ['/admin/about', AdminAbout],
                ['/admin/projects', AdminProjects],
                ['/admin/diagnostics', AdminDiagnostics],
                ['/admin/videos', AdminVideos],
                ['/admin/gallery', AdminGallery],
                ['/admin/skills', AdminSkills],
                ['/admin/certificates', AdminCertificates],
                ['/admin/cv', AdminCV],
                ['/admin/messages', AdminMessages],
                ['/admin/seo', AdminSeo],
                ['/admin/social', AdminSocial],
                ['/admin/settings', AdminSettings],
              ].map(([path, Component]) => {
                const Page = Component as React.ComponentType
                return (
                  <Route
                    key={path as string}
                    path={path as string}
                    element={
                      <Suspense fallback={<AdminFallback />}>
                        <Page />
                      </Suspense>
                    }
                  />
                )
              })}
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>
          </Routes>
        </SiteDataProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
