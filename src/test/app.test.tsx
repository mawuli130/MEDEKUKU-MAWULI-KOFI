/**
 * End-to-end behaviour tests rendered against the real application tree.
 *
 * These exercise the actual routers, providers, repository adapters, validation
 * and admin screens — the same code that ships. The local adapter is used as the
 * data source, which implements the identical Repository contract as Supabase.
 */
import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { readDatabase } from '@/services/localStore'
import { authService } from '@/services/auth'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

async function signIn() {
  await authService.signIn('admin@mawulidiagnostics.com', 'Diagnostics2026!')
}

describe('public pages', () => {
  it('renders the homepage with the professional identity and hero actions', async () => {
    renderAt('/')
    expect(
      await screen.findByRole('heading', { level: 1, name: /Medekuku Mawuli Kofi/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Automotive Electronics & Diagnostic Technician/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Mawuli Engineering & Diagnostic Services/i)).toBeInTheDocument()

    // Required hero buttons
    expect(screen.getByRole('link', { name: /explore automotive projects/i })).toHaveAttribute('href', '/projects')
    expect(screen.getByRole('link', { name: /view diagnostic case studies/i })).toHaveAttribute(
      'href',
      '/diagnostics',
    )
    expect(screen.getByRole('link', { name: /watch my youtube videos/i })).toHaveAttribute('href', '/videos')
    expect(screen.getAllByRole('link', { name: /contact me/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /download my cv/i }).length).toBeGreaterThan(0)
  })

  it('shows professional empty states when the database has no content', async () => {
    renderAt('/')
    expect(await screen.findByText('Add Your First Automotive Project')).toBeInTheDocument()
    expect(screen.getByText('Add Your First Diagnostic Case Study')).toBeInTheDocument()
    expect(screen.getByText('Add Your YouTube Video')).toBeInTheDocument()
    expect(screen.getByText('Upload Your Workshop Photograph')).toBeInTheDocument()
    expect(screen.getByText('Upload Your Certificate')).toBeInTheDocument()
  })

  it('renders the about page, skills page and CV page', async () => {
    const about = renderAt('/about')
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getAllByText(/Automotive interests/i).length).toBeGreaterThan(0)
    about.unmount()

    renderAt('/skills')
    expect(
      await screen.findByRole('heading', { level: 1, name: /Capability across electrical/i }),
    ).toBeInTheDocument()
    // The seeded catalogue must be visible with honest level labels
    expect(await screen.findByText('OBD-II diagnostics')).toBeInTheDocument()
    expect(screen.getAllByText(/Technical interest/i).length).toBeGreaterThan(0)
  })

  it('renders every public route without crashing', async () => {
    const routes = [
      '/',
      '/about',
      '/projects',
      '/diagnostics',
      '/videos',
      '/gallery',
      '/skills',
      '/certificates',
      '/cv',
      '/contact',
    ]
    for (const route of routes) {
      const view = renderAt(route)
      await waitFor(() => {
        expect(view.container.querySelector('h1')).not.toBeNull()
      })
      expect(view.container.querySelector('nav[aria-label="Primary"]')).not.toBeNull()
      view.unmount()
    }
  })

  it('renders a 404 page for unknown routes', async () => {
    renderAt('/this-route-does-not-exist')
    expect(await screen.findByRole('heading', { level: 1, name: /This circuit is open/i })).toBeInTheDocument()
    expect(screen.getByText(/Error 404/i)).toBeInTheDocument()
  })

  it('shows a project-not-found state for an unknown slug', async () => {
    renderAt('/projects/does-not-exist')
    expect(await screen.findByText(/Project not found/i)).toBeInTheDocument()
  })
})

describe('contact form', () => {
  it('validates fields before submitting', async () => {
    const user = userEvent.setup()
    renderAt('/contact')

    await user.click(await screen.findByRole('button', { name: /send message/i }))

    expect(await screen.findByText(/Please enter your full name/i)).toBeInTheDocument()
    expect(screen.getByText(/An email address is required/i)).toBeInTheDocument()
    expect(readDatabase().contact_messages).toHaveLength(0)
  })

  it('stores a valid message and confirms success', async () => {
    const user = userEvent.setup()
    renderAt('/contact')

    await user.type(await screen.findByLabelText(/Full name/i), 'Kwame Boateng')
    await user.type(screen.getByLabelText(/Email address/i), 'kwame@workshop.gh')
    await user.type(screen.getByLabelText(/Subject/i), 'Diagnostic technician role')
    await user.type(
      screen.getByLabelText(/^Message/i),
      'We are recruiting an automotive diagnostic technician and would like to discuss your experience.',
    )
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText(/your message has been stored securely/i)).toBeInTheDocument()

    const stored = readDatabase().contact_messages
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Kwame Boateng')
    expect(stored[0].status).toBe('new')
  })
})

describe('admin authentication', () => {
  it('redirects unauthenticated visitors away from the dashboard', async () => {
    renderAt('/admin/dashboard')
    expect(await screen.findByRole('heading', { name: /Administrator/i })).toBeInTheDocument()
    expect(window.location.pathname).not.toBe('/admin/dashboard')
  })

  it('rejects incorrect credentials', async () => {
    const user = userEvent.setup()
    renderAt('/admin')
    await user.type(await screen.findByLabelText(/Email address/i), 'admin@mawulidiagnostics.com')
    await user.type(screen.getByLabelText(/Password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByText(/Email or password is incorrect/i)).toBeInTheDocument()
  })

  it('signs in and shows the dashboard with all content sections', async () => {
    const user = userEvent.setup()
    renderAt('/admin')

    await user.type(await screen.findByLabelText(/Email address/i), 'admin@mawulidiagnostics.com')
    await user.type(screen.getByLabelText(/Password/i), 'Diagnostics2026!')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByRole('heading', { name: /^Dashboard$/i })).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: /Administrator sections/i })
    for (const label of [
      'Dashboard',
      'Automotive Projects',
      'Diagnostic Cases',
      'YouTube Videos',
      'Workshop Gallery',
      'Certificates',
      'Automotive Skills',
      'Profile Management',
      'About Me',
      'CV Management',
      'Contact Messages',
      'SEO Settings',
      'Social Links',
      'Website Settings',
    ]) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument()
    }
  })
})

describe('admin CRUD', () => {
  it('creates, publishes, edits and deletes an automotive project', async () => {
    const user = userEvent.setup()
    await signIn()
    renderAt('/admin/projects')

    // Empty state
    expect(await screen.findByText('Add Your First Automotive Project')).toBeInTheDocument()

    // --- Create ---
    await user.click(screen.getByRole('button', { name: /create project/i }))
    const drawer = await screen.findByRole('dialog')

    await user.type(within(drawer).getByLabelText(/Project title/i), 'ABS warning light — wheel speed signal')
    await user.type(
      within(drawer).getByLabelText(/Project description/i),
      'Diagnosed an intermittent ABS warning light caused by a damaged wheel speed sensor harness.',
    )
    await user.type(within(drawer).getByLabelText(/Vehicle make/i), 'Toyota')
    await user.type(within(drawer).getByLabelText(/Vehicle model/i), 'Corolla')
    await user.type(within(drawer).getByLabelText(/Vehicle year/i), '2014')

    await user.click(within(drawer).getByRole('button', { name: /create project/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    let stored = readDatabase().projects
    expect(stored).toHaveLength(1)
    expect(stored[0].title).toBe('ABS warning light — wheel speed signal')
    expect(stored[0].slug).toBe('abs-warning-light-wheel-speed-signal')
    expect(stored[0].status).toBe('draft')
    expect(stored[0].vehicle_year).toBe(2014)

    // --- Publish via edit ---
    await user.click(await screen.findByRole('button', { name: 'Edit record' }))
    const editDrawer = await screen.findByRole('dialog')
    await user.selectOptions(within(editDrawer).getByLabelText(/Publication status/i), 'published')
    await user.click(within(editDrawer).getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(readDatabase().projects[0].status).toBe('published')
    })
    expect(readDatabase().projects[0].published_at).toBeTruthy()

    // --- Visible on the public site ---
    const publicView = renderAt('/projects')
    expect(await screen.findByText('ABS warning light — wheel speed signal')).toBeInTheDocument()
    publicView.unmount()

    // --- Delete ---
    await user.click(screen.getAllByRole('button', { name: 'Delete record' })[0])
    const confirm = await screen.findByRole('dialog', { name: /delete this project\?/i })
    await user.click(within(confirm).getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(readDatabase().projects).toHaveLength(0)
    })
  })

  it('blocks saving a project with validation errors', async () => {
    const user = userEvent.setup()
    await signIn()
    renderAt('/admin/projects')

    await user.click(await screen.findByRole('button', { name: /create project/i }))
    const drawer = await screen.findByRole('dialog')
    await user.click(within(drawer).getByRole('button', { name: /create project/i }))

    expect(await within(drawer).findByText(/A project title is required/i)).toBeInTheDocument()
    expect(readDatabase().projects).toHaveLength(0)
  })

  it('adds a YouTube video and extracts the video id from the URL', async () => {
    const user = userEvent.setup()
    await signIn()
    renderAt('/admin/videos')

    await user.click(await screen.findByRole('button', { name: /add video/i }))
    const drawer = await screen.findByRole('dialog')

    await user.type(
      within(drawer).getByLabelText(/YouTube URL/i),
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
    expect(await within(drawer).findByText(/Video ID: dQw4w9WgXcQ/i)).toBeInTheDocument()

    await user.type(within(drawer).getByLabelText(/Video title/i), 'Crankshaft sensor signal test with a scope')
    await user.selectOptions(within(drawer).getByLabelText(/Publication status/i), 'published')
    await user.click(within(drawer).getByRole('button', { name: /^add video$/i }))

    await waitFor(() => {
      const stored = readDatabase().youtube_videos
      expect(stored).toHaveLength(1)
      expect(stored[0].youtube_video_id).toBe('dQw4w9WgXcQ')
      expect(stored[0].status).toBe('published')
    })
  })

  it('rejects a non-YouTube URL for a video', async () => {
    const user = userEvent.setup()
    await signIn()
    renderAt('/admin/videos')

    await user.click(await screen.findByRole('button', { name: /add video/i }))
    const drawer = await screen.findByRole('dialog')
    await user.type(within(drawer).getByLabelText(/YouTube URL/i), 'https://vimeo.com/12345')
    await user.type(within(drawer).getByLabelText(/Video title/i), 'A video title that is long enough')
    await user.click(within(drawer).getByRole('button', { name: /^add video$/i }))

    expect(
      await within(drawer).findByText(/This is not a recognisable YouTube video URL/i),
    ).toBeInTheDocument()
    expect(readDatabase().youtube_videos).toHaveLength(0)
  })

  it('creates a diagnostic case study and renders its technical report', async () => {
    const user = userEvent.setup()
    await signIn()
    renderAt('/admin/diagnostics')

    await user.click(await screen.findByRole('button', { name: /create case study/i }))
    const drawer = await screen.findByRole('dialog')

    await user.type(within(drawer).getByLabelText(/Case title/i), 'Intermittent no-start, crankshaft signal')
    await user.type(within(drawer).getByLabelText(/Vehicle system/i), 'Engine management')
    await user.type(
      within(drawer).getByLabelText(/Customer complaint/i),
      'Engine cranks but does not start intermittently when hot.',
    )
    await user.type(within(drawer).getByLabelText(/Private|Vehicle identification/i), 'VIN-SHOULD-NOT-BE-PUBLIC')

    // DTC repeater
    await user.click(within(drawer).getByRole('button', { name: /add dtc/i }))
    await user.type(within(drawer).getByLabelText('DTC code'), 'P0335')

    // Verification repeater
    await user.click(within(drawer).getByRole('button', { name: /add verification check/i }))
    await user.type(within(drawer).getByLabelText('Verification check'), 'Post-repair rescan, no codes')

    await user.selectOptions(within(drawer).getByLabelText(/Publication status/i), 'published')
    await user.click(within(drawer).getByRole('button', { name: /create case study/i }))

    await waitFor(() => {
      const stored = readDatabase().diagnostic_cases
      expect(stored).toHaveLength(1)
      expect(stored[0].slug).toBe('intermittent-no-start-crankshaft-signal')
      expect(stored[0].dtc_codes[0].code).toBe('P0335')
      // Private identification is stored but must never be rendered publicly
      expect(stored[0].vehicle_identification).toBe('VIN-SHOULD-NOT-BE-PUBLIC')
    })

    // --- Public report ---
    const report = renderAt('/diagnostics/intermittent-no-start-crankshaft-signal')
    expect(await screen.findByRole('heading', { level: 1, name: /Intermittent no-start/i })).toBeInTheDocument()
    expect(screen.getByText('P0335')).toBeInTheDocument()
    expect(screen.getByText(/Post-repair rescan, no codes/i)).toBeInTheDocument()
    expect(screen.getByText(/Customer complaint/i)).toBeInTheDocument()
    expect(screen.getByText(/Diagnostic procedure/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /^Verification$/i })).toBeInTheDocument()

    // Privacy assertion
    expect(report.container.textContent).not.toContain('VIN-SHOULD-NOT-BE-PUBLIC')
  })

  it('updates the profile and reflects it on the public homepage', async () => {
    const user = userEvent.setup()
    await signIn()
    renderAt('/admin/profile')

    const headline = await screen.findByLabelText(/Professional headline/i)
    await user.clear(headline)
    await user.type(headline, 'Automotive Diagnostic Specialist')
    await user.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => {
      expect(readDatabase().profile.headline).toBe('Automotive Diagnostic Specialist')
    })

    const home = renderAt('/')
    expect(await screen.findByText('Automotive Diagnostic Specialist')).toBeInTheDocument()
    home.unmount()
  })

  it('reads contact messages in the admin inbox only', async () => {
    await signIn()
    readDatabase()
    const { localRepository } = await import('@/services/localAdapter')
    await localRepository.messages.submit({
      name: 'Ama Mensah',
      email: 'ama@example.com',
      subject: 'Training enquiry',
      message: 'I would like to ask about automotive electronics training opportunities.',
      token: 'test',
    })

    renderAt('/admin/messages')
    // Subject appears in the list and in the opened message pane.
    expect((await screen.findAllByText('Training enquiry')).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/ama@example.com/i).length).toBeGreaterThan(0)
  })

  it('never exposes contact messages on public pages', async () => {
    const { localRepository } = await import('@/services/localAdapter')
    await localRepository.messages.submit({
      name: 'Private Person',
      email: 'private@example.com',
      subject: 'Confidential subject line',
      message: 'This message must never be visible to public visitors of the website.',
      token: 'test',
    })

    for (const route of ['/', '/about', '/contact', '/projects']) {
      const view = renderAt(route)
      await waitFor(() => expect(view.container.querySelector('h1')).not.toBeNull())
      expect(view.container.textContent).not.toContain('Confidential subject line')
      expect(view.container.textContent).not.toContain('private@example.com')
      view.unmount()
    }
  })
})
