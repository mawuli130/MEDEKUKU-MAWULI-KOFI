export interface NavItem {
  label: string
  to: string
  description?: string
}

/** Primary navigation. Order is intentionally diagnostics-forward. */
export const PRIMARY_NAV: NavItem[] = [
  { label: 'Home', to: '/', description: 'Automotive electronics & diagnostics portfolio' },
  { label: 'About Me', to: '/about', description: 'Background, training and career direction' },
  { label: 'Projects', to: '/projects', description: 'Documented vehicle work' },
  { label: 'Diagnostics', to: '/diagnostics', description: 'Diagnostic case studies' },
  { label: 'Videos', to: '/videos', description: 'YouTube technical demonstrations' },
  { label: 'Gallery', to: '/gallery', description: 'Workshop photography' },
  { label: 'Skills', to: '/skills', description: 'Automotive capabilities' },
  { label: 'Certificates', to: '/certificates', description: 'Training and achievements' },
  { label: 'CV', to: '/cv', description: 'Downloadable curriculum vitae' },
  { label: 'Contact', to: '/contact', description: 'Enquiries and opportunities' },
]

/** Split used by the desktop bar so it stays on one line at 1280px. */
export function isActivePath(current: string, target: string): boolean {
  if (target === '/') return current === '/'
  return current === target || current.startsWith(`${target}/`)
}
