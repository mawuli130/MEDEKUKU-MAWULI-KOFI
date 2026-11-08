-- =====================================================================
-- Mawuli Engineering & Diagnostic Services — initial content
-- =====================================================================
-- This seed contains ONLY the professional identity supplied for the project,
-- the site settings, and the skill catalogue. It deliberately contains:
--   * NO invented projects, repairs, DTCs or measurements
--   * NO invented certificates, employers or qualifications
--   * NO invented YouTube URLs or social profile links
-- Those records are added by the administrator through /admin.
-- Run after 0001_init.sql and 0002_rls_policies.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Profile (singleton)
-- ---------------------------------------------------------------------
insert into public.profiles (
  full_name, headline, biography, hero_intro, location, career_goals,
  automotive_interests, timeline
)
values (
  'Medekuku Mawuli Kofi',
  'Automotive Electronics & Diagnostic Technician',
  'Medekuku Mawuli Kofi is an Automotive Electronics & Diagnostic Technician based in Accra, Ghana, specializing in vehicle electrical systems, electronic control units, engine management systems, and automotive fault diagnosis.',
  'I specialize in automotive electrical and electronic systems, vehicle diagnostics, ECU-related troubleshooting, and practical workshop repairs. My portfolio showcases real automotive projects, diagnostic procedures, technical demonstrations, and my continuous development in the automotive industry.',
  'Accra, Ghana',
  'To develop into a highly skilled automotive diagnostic specialist, working with modern electronic control systems, and to contribute to workshops, dealerships and diagnostic centres in Ghana and internationally.',
  '["Vehicle diagnostics","ECU and TCU systems","Engine management","Automotive electrical troubleshooting","Hybrid vehicle systems","Automotive electronic control systems"]'::jsonb,
  '[]'::jsonb
)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Site settings
-- ---------------------------------------------------------------------
insert into public.site_settings (setting_key, setting_value) values
  ('site_name', 'Mawuli Engineering & Diagnostic Services'),
  ('site_tagline', 'Automotive Electronics & Diagnostic Services — Accra, Ghana'),
  ('meta_title', 'Medekuku Mawuli Kofi — Automotive Electronics & Diagnostic Technician'),
  ('meta_description', 'Official automotive portfolio of Medekuku Mawuli Kofi, an Automotive Electronics & Diagnostic Technician in Ghana. Explore vehicle diagnostics, ECU systems, electrical repairs, workshop projects, and technical demonstrations.'),
  ('og_image', ''),
  ('keywords', 'Medekuku Mawuli Kofi, automotive electronics technician Ghana, automotive diagnostic technician Ghana, vehicle diagnostics Accra, automotive electrical technician, ECU diagnostics, automotive electrical troubleshooting, automotive diagnostic case studies'),
  ('canonical_name', 'Medekuku Mawuli Kofi'),
  ('contact_intro', 'For workshop roles, diagnostic work, technical collaboration or training opportunities, send a message using the form below.'),
  ('cv_headline', 'Automotive Electronics & Diagnostic Technician — Curriculum Vitae'),
  ('contact_notification_email', ''),
  ('allow_contact_form', 'true'),
  ('footer_note', ''),
  ('ga_measurement_id', '')
on conflict (setting_key) do update
  set setting_value = excluded.setting_value
  where public.site_settings.setting_value = '';

-- ---------------------------------------------------------------------
-- Skills — honest level vocabulary: practical / developing / interest
-- ---------------------------------------------------------------------
insert into public.skills (name, category, description, skill_level, display_order) values
  ('Automotive circuit troubleshooting', 'Automotive Electrical Systems', 'Working through a circuit from supply to load to isolate an open, short or high-resistance path.', 'practical', 1),
  ('Electrical voltage testing', 'Automotive Electrical Systems', 'Measuring supply, reference and signal voltages against specification with a digital multimeter.', 'practical', 2),
  ('Resistance testing', 'Automotive Electrical Systems', 'Checking component and circuit resistance to identify open windings, corrosion and poor connections.', 'practical', 3),
  ('Continuity testing', 'Automotive Electrical Systems', 'Verifying harness integrity, connector pins and splice points during fault finding.', 'practical', 4),
  ('Power and ground diagnosis', 'Automotive Electrical Systems', 'Load-testing feeds and grounds, including voltage-drop testing under load.', 'practical', 5),
  ('Wiring inspection', 'Automotive Electrical Systems', 'Reading wiring diagrams and inspecting harnesses, routing and connectors.', 'practical', 6),

  ('Electronic control units', 'Automotive Electronics', 'Understanding ECU inputs, outputs, power supplies and communication interfaces.', 'practical', 1),
  ('Engine management systems', 'Automotive Electronics', 'Fault finding on fuel, ignition and air-management control circuits.', 'practical', 2),
  ('ECU and TCU systems', 'Automotive Electronics', 'Diagnosing engine and transmission control modules, their supplies and network links.', 'developing', 3),
  ('Sensors and actuators', 'Automotive Electronics', 'Testing sensor signal output and actuator operation in response to commands.', 'practical', 4),
  ('Electronic signal diagnosis', 'Automotive Electronics', 'Interpreting analogue, digital and PWM signals at component and module level.', 'developing', 5),

  ('OBD-II diagnostics', 'Vehicle Diagnostics', 'Connecting to the diagnostic socket, reading stored and pending codes, and clearing only after repair.', 'practical', 1),
  ('Diagnostic trouble code interpretation', 'Vehicle Diagnostics', 'Using DTCs as a starting point rather than a conclusion, and cross-checking with live data.', 'practical', 2),
  ('Live data analysis', 'Vehicle Diagnostics', 'Comparing live parameter values against expected ranges and operating conditions.', 'practical', 3),
  ('Freeze-frame analysis', 'Vehicle Diagnostics', 'Reading stored freeze-frame conditions to understand when a fault was set.', 'developing', 4),
  ('Scan tool usage', 'Vehicle Diagnostics', 'Navigating diagnostic scan tools for codes, live data, actuator tests and service functions.', 'practical', 5),
  ('Systematic fault diagnosis', 'Vehicle Diagnostics', 'Following a structured test plan from complaint to confirmed root cause before replacing parts.', 'practical', 6),

  ('Automotive servicing', 'Mechanical Skills', 'Routine servicing including filters, fluids and scheduled inspection.', 'practical', 1),
  ('Mechanical inspection', 'Mechanical Skills', 'Checking mechanical condition, wear and alignment as part of a full-vehicle assessment.', 'practical', 2),
  ('Engine-related troubleshooting', 'Mechanical Skills', 'Investigating running, starting and performance complaints alongside electronic faults.', 'practical', 3),
  ('Brake system servicing', 'Mechanical Skills', 'Inspection and servicing of hydraulic brake components and related sensors.', 'developing', 4),
  ('Workshop repair procedures', 'Mechanical Skills', 'Following safe workshop procedure, correct tooling and manufacturer guidance.', 'practical', 5),

  ('Hybrid vehicle diagnostics', 'Advanced Technical Interests', 'Studying high-voltage safety, hybrid control architecture and diagnostic access.', 'interest', 1),
  ('CAN communication', 'Advanced Technical Interests', 'Understanding CAN bus topology, differential signalling and network fault isolation.', 'developing', 2),
  ('LIN communication', 'Advanced Technical Interests', 'Single-wire LIN networks used for body and accessory modules.', 'interest', 3),
  ('Automotive oscilloscope diagnostics', 'Advanced Technical Interests', 'Capturing and interpreting waveforms for sensors, injectors, ignition and networks.', 'developing', 4),
  ('ECU programming and configuration', 'Advanced Technical Interests', 'Coding, adaptation and configuration procedures carried out under correct conditions.', 'interest', 5)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Administrator authorisation
-- ---------------------------------------------------------------------
-- 1. Create the user in Supabase → Authentication → Users (or via the CLI).
-- 2. Replace the email below, then run this statement once:
--
-- insert into public.admin_users (user_id, email, display_name)
-- select id, email, 'Medekuku Mawuli Kofi'
-- from auth.users
-- where email = 'you@example.com'
-- on conflict (user_id) do nothing;
--
-- Nothing is seeded here: administrator authorisation must be explicit.
