/**
 * Default content.
 *
 * IMPORTANT: nothing in this file invents a repair, a measurement, a DTC, a
 * certificate, an employer or a social profile. It only contains the identity
 * text supplied for this project plus neutral placeholders that the
 * administrator replaces through /admin.
 */
import type {
  Profile,
  Skill,
  SiteSettingsMap,
  TimelineEntry,
} from '@/types'
import { CONTACT } from '@/lib/config'

export const EMPTY_UUID = '00000000-0000-0000-0000-000000000000'

export const defaultProfile: Profile = {
  id: EMPTY_UUID,
  full_name: CONTACT.name,
  headline: CONTACT.role,
  biography:
    'Medekuku Mawuli Kofi is an Automotive Electronics & Diagnostic Technician based in Accra, Ghana, specializing in vehicle electrical systems, electronic control units, engine management systems, and automotive fault diagnosis.',
  hero_intro:
    'I specialize in automotive electrical and electronic systems, vehicle diagnostics, ECU-related troubleshooting, and practical workshop repairs. My portfolio showcases real automotive projects, diagnostic procedures, technical demonstrations, and my continuous development in the automotive industry.',
  location: `${CONTACT.city}, ${CONTACT.country}`,
  profile_image: null,
  email: null,
  phone: null,
  cv_url: null,
  career_goals:
    'To develop into a highly skilled automotive diagnostic specialist, working with modern electronic control systems, and to contribute to workshops, dealerships and diagnostic centres in Ghana and internationally.',
  automotive_interests: [
    'Vehicle diagnostics',
    'ECU and TCU systems',
    'Engine management',
    'Automotive electrical troubleshooting',
    'Hybrid vehicle systems',
    'Automotive electronic control systems',
  ],
  timeline: [] as TimelineEntry[],
  created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  updated_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
}

/**
 * Skill catalogue. Levels reflect an *honest self-assessment vocabulary*:
 *   practical  — used repeatedly on vehicles in a workshop setting
 *   developing — building competency through practice and study
 *   interest   — a technical area of active study, not yet a delivered skill
 * No fake percentage ratings are stored anywhere.
 */
type SkillSeed = Pick<Skill, 'name' | 'category' | 'description' | 'skill_level' | 'display_order'>

export const defaultSkills: SkillSeed[] = [
  // Automotive Electrical Systems
  { name: 'Automotive circuit troubleshooting', category: 'Automotive Electrical Systems', description: 'Working through a circuit from supply to load to isolate an open, short or high-resistance path.', skill_level: 'practical', display_order: 1 },
  { name: 'Electrical voltage testing', category: 'Automotive Electrical Systems', description: 'Measuring supply, reference and signal voltages against specification with a digital multimeter.', skill_level: 'practical', display_order: 2 },
  { name: 'Resistance testing', category: 'Automotive Electrical Systems', description: 'Checking component and circuit resistance to identify open windings, corrosion and poor connections.', skill_level: 'practical', display_order: 3 },
  { name: 'Continuity testing', category: 'Automotive Electrical Systems', description: 'Verifying harness integrity, connector pins and splice points during fault finding.', skill_level: 'practical', display_order: 4 },
  { name: 'Power and ground diagnosis', category: 'Automotive Electrical Systems', description: 'Load-testing feeds and grounds, including voltage-drop testing under load.', skill_level: 'practical', display_order: 5 },
  { name: 'Wiring inspection', category: 'Automotive Electrical Systems', description: 'Reading wiring diagrams and inspecting harnesses, routing and connectors.', skill_level: 'practical', display_order: 6 },

  // Automotive Electronics
  { name: 'Electronic control units', category: 'Automotive Electronics', description: 'Understanding ECU inputs, outputs, power supplies and communication interfaces.', skill_level: 'practical', display_order: 1 },
  { name: 'Engine management systems', category: 'Automotive Electronics', description: 'Fault finding on fuel, ignition and air-management control circuits.', skill_level: 'practical', display_order: 2 },
  { name: 'ECU and TCU systems', category: 'Automotive Electronics', description: 'Diagnosing engine and transmission control modules, their supplies and network links.', skill_level: 'developing', display_order: 3 },
  { name: 'Sensors and actuators', category: 'Automotive Electronics', description: 'Testing sensor signal output and actuator operation in response to commands.', skill_level: 'practical', display_order: 4 },
  { name: 'Electronic signal diagnosis', category: 'Automotive Electronics', description: 'Interpreting analogue, digital and PWM signals at component and module level.', skill_level: 'developing', display_order: 5 },

  // Vehicle Diagnostics
  { name: 'OBD-II diagnostics', category: 'Vehicle Diagnostics', description: 'Connecting to the diagnostic socket, reading stored and pending codes, and clearing only after repair.', skill_level: 'practical', display_order: 1 },
  { name: 'Diagnostic trouble code interpretation', category: 'Vehicle Diagnostics', description: 'Using DTCs as a starting point rather than a conclusion, and cross-checking with live data.', skill_level: 'practical', display_order: 2 },
  { name: 'Live data analysis', category: 'Vehicle Diagnostics', description: 'Comparing live parameter values against expected ranges and operating conditions.', skill_level: 'practical', display_order: 3 },
  { name: 'Freeze-frame analysis', category: 'Vehicle Diagnostics', description: 'Reading stored freeze-frame conditions to understand when a fault was set.', skill_level: 'developing', display_order: 4 },
  { name: 'Scan tool usage', category: 'Vehicle Diagnostics', description: 'Navigating diagnostic scan tools for codes, live data, actuator tests and service functions.', skill_level: 'practical', display_order: 5 },
  { name: 'Systematic fault diagnosis', category: 'Vehicle Diagnostics', description: 'Following a structured test plan from complaint to confirmed root cause before replacing parts.', skill_level: 'practical', display_order: 6 },

  // Mechanical Skills
  { name: 'Automotive servicing', category: 'Mechanical Skills', description: 'Routine servicing including filters, fluids and scheduled inspection.', skill_level: 'practical', display_order: 1 },
  { name: 'Mechanical inspection', category: 'Mechanical Skills', description: 'Checking mechanical condition, wear and alignment as part of a full-vehicle assessment.', skill_level: 'practical', display_order: 2 },
  { name: 'Engine-related troubleshooting', category: 'Mechanical Skills', description: 'Investigating running, starting and performance complaints alongside electronic faults.', skill_level: 'practical', display_order: 3 },
  { name: 'Brake system servicing', category: 'Mechanical Skills', description: 'Inspection and servicing of hydraulic brake components and related sensors.', skill_level: 'developing', display_order: 4 },
  { name: 'Workshop repair procedures', category: 'Mechanical Skills', description: 'Following safe workshop procedure, correct tooling and manufacturer guidance.', skill_level: 'practical', display_order: 5 },

  // Advanced Technical Interests
  { name: 'Hybrid vehicle diagnostics', category: 'Advanced Technical Interests', description: 'Studying high-voltage safety, hybrid control architecture and diagnostic access.', skill_level: 'interest', display_order: 1 },
  { name: 'CAN communication', category: 'Advanced Technical Interests', description: 'Understanding CAN bus topology, differential signalling and network fault isolation.', skill_level: 'developing', display_order: 2 },
  { name: 'LIN communication', category: 'Advanced Technical Interests', description: 'Single-wire LIN networks used for body and accessory modules.', skill_level: 'interest', display_order: 3 },
  { name: 'Automotive oscilloscope diagnostics', category: 'Advanced Technical Interests', description: 'Capturing and interpreting waveforms for sensors, injectors, ignition and networks.', skill_level: 'developing', display_order: 4 },
  { name: 'ECU programming and configuration', category: 'Advanced Technical Interests', description: 'Coding, adaptation and configuration procedures carried out under correct conditions.', skill_level: 'interest', display_order: 5 },
]

export const defaultSettings: SiteSettingsMap = {
  site_name: 'Mawuli Engineering & Diagnostic Services',
  site_tagline: 'Automotive Electronics & Diagnostic Services — Accra, Ghana',
  meta_title: 'Medekuku Mawuli Kofi — Automotive Electronics & Diagnostic Technician',
  meta_description:
    'Official automotive portfolio of Medekuku Mawuli Kofi, an Automotive Electronics & Diagnostic Technician in Ghana. Explore vehicle diagnostics, ECU systems, electrical repairs, workshop projects, and technical demonstrations.',
  og_image: '',
  keywords:
    'Medekuku Mawuli Kofi, automotive electronics technician Ghana, automotive diagnostic technician Ghana, vehicle diagnostics Accra, automotive electrical technician, ECU diagnostics, automotive electrical troubleshooting, automotive diagnostic case studies',
  canonical_name: 'Medekuku Mawuli Kofi',
  contact_intro:
    'For workshop roles, diagnostic work, technical collaboration or training opportunities, send a message using the form below.',
  cv_headline: 'Automotive Electronics & Diagnostic Technician — Curriculum Vitae',
  contact_notification_email: '',
  allow_contact_form: 'true',
  footer_note: '',
  ga_measurement_id: '',
}

export const SKILL_LEVEL_COPY = {
  practical: {
    label: 'Practical',
    description: 'Applied repeatedly on vehicles during workshop work.',
    tone: 'signal' as const,
  },
  developing: {
    label: 'Developing',
    description: 'Building competency through supervised practice and study.',
    tone: 'neutral' as const,
  },
  interest: {
    label: 'Technical interest',
    description: 'An area of active study — not presented as a delivered skill.',
    tone: 'muted' as const,
  },
}

/** Empty-state copy, shared by public pages and the dashboard. */
export const EMPTY_STATES = {
  projects: {
    title: 'Add Your First Automotive Project',
    body: 'Documented vehicle work will appear here — the vehicle, the complaint, the diagnostic procedure, the repair and the outcome.',
  },
  diagnostics: {
    title: 'Add Your First Diagnostic Case Study',
    body: 'Each published case will show the complaint, DTCs, test plan, confirmed fault and post-repair verification as a technical report.',
  },
  videos: {
    title: 'Add Your YouTube Video',
    body: 'Diagnostic demonstrations and workshop footage will be embedded here from your YouTube channel.',
  },
  gallery: {
    title: 'Upload Your Workshop Photograph',
    body: 'Genuine photographs of diagnostics, repairs, tools and certificates will be displayed in this gallery.',
  },
  certificates: {
    title: 'Upload Your Certificate',
    body: 'Technical education, automotive training and project achievements will be listed here once uploaded.',
  },
  skills: {
    title: 'Skills not configured yet',
    body: 'Skill entries are managed from the administrator dashboard.',
  },
  timeline: {
    title: 'No timeline entries yet',
    body: 'Education, workshop experience, attachments and training are added from the dashboard.',
  },
  cv: {
    title: 'Upload Your CV',
    body: 'The CV PDF has not been uploaded yet. Once added from the dashboard, visitors can download it here without signing in.',
  },
} as const
