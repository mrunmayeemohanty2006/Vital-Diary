-- Vital Diary Database Migration: Doctor Portal & Temporary Patient Access Sessions
-- Table: patient_access_sessions
-- Security: Server-side authorization RPCs & Row Level Security

-- 1. PATIENT ACCESS SESSIONS TABLE
create table if not exists public.patient_access_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  otp_code text not null,
  duration_minutes integer not null default 30,
  expires_at timestamp with time zone not null,
  doctor_id uuid references public.profiles(id),
  doctor_name text,
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'revoked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  accessed_at timestamp with time zone,
  revoked_at timestamp with time zone
);

-- Enable RLS for patient_access_sessions
alter table public.patient_access_sessions enable row level security;

-- Index for fast lookup on session_id and expiration
create index if not exists idx_patient_access_sessions_session_id on public.patient_access_sessions(session_id);
create index if not exists idx_patient_access_sessions_expires_at on public.patient_access_sessions(expires_at);
create index if not exists idx_patient_access_sessions_patient_id on public.patient_access_sessions(patient_id);
create index if not exists idx_patient_access_sessions_doctor_id on public.patient_access_sessions(doctor_id);

-- RLS Policies:
-- Patients can view and manage their own generated access sessions
create policy "Patients can view their own access sessions"
  on public.patient_access_sessions for select
  using (auth.uid() = patient_id);

create policy "Patients can insert their own access sessions"
  on public.patient_access_sessions for insert
  with check (auth.uid() = patient_id);

create policy "Patients can update their own access sessions"
  on public.patient_access_sessions for update
  using (auth.uid() = patient_id);

create policy "Doctors can view active sessions they are assigned to"
  on public.patient_access_sessions for select
  using (auth.uid() = doctor_id);


-- 2. SECURITY DEFINER RPC: verify_doctor_access
-- Validates that session exists, OTP matches, and session is not expired.
-- If valid, binds the session to the authenticated doctor and activates access.
create or replace function public.verify_doctor_access(
  p_session_id text,
  p_otp_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_patient record;
  v_doctor_id uuid;
  v_doctor_name text;
begin
  v_doctor_id := auth.uid();
  
  -- If not authenticated via Supabase auth, raise exception
  if v_doctor_id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'Authentication required. Doctor must be logged in.'
    );
  end if;

  -- Lookup doctor profile name
  select name into v_doctor_name from public.profiles where id = v_doctor_id;

  -- Find the session
  select * into v_session
  from public.patient_access_sessions
  where session_id = p_session_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Invalid access session ID or QR code.'
    );
  end if;

  -- Check if revoked or already expired
  if v_session.status = 'revoked' then
    return jsonb_build_object(
      'success', false,
      'error', 'This access session was revoked by the patient.'
    );
  end if;

  if v_session.expires_at < now() then
    -- Mark as expired
    update public.patient_access_sessions
    set status = 'expired'
    where id = v_session.id;

    return jsonb_build_object(
      'success', false,
      'error', 'This access session has expired.'
    );
  end if;

  -- Check OTP code (case-insensitive trim)
  if trim(v_session.otp_code) != trim(p_otp_code) then
    return jsonb_build_object(
      'success', false,
      'error', 'Invalid OTP code. Please check with the patient.'
    );
  end if;

  -- Activate session for this doctor
  update public.patient_access_sessions
  set
    doctor_id = v_doctor_id,
    doctor_name = coalesce(v_doctor_name, 'Dr. Healthcare Provider'),
    status = 'active',
    accessed_at = now()
  where id = v_session.id
  returning * into v_session;

  -- Fetch patient profile
  select id, name, email, avatar, date_of_birth, blood_group into v_patient
  from public.profiles
  where id = v_session.patient_id;

  return jsonb_build_object(
    'success', true,
    'sessionId', v_session.session_id,
    'expiresAt', v_session.expires_at,
    'durationMinutes', v_session.duration_minutes,
    'patient', jsonb_build_object(
      'id', v_patient.id,
      'name', coalesce(v_patient.name, 'Patient'),
      'avatar', v_patient.avatar,
      'dateOfBirth', v_patient.date_of_birth,
      'bloodGroup', v_patient.blood_group
    )
  );
end;
$$;


-- 3. SECURITY DEFINER RPC: get_authorized_patient_records
-- Securely retrieves medical records for a patient ONLY while doctor holds an active, unexpired session.
create or replace function public.get_authorized_patient_records(
  p_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_patient record;
  v_records jsonb;
  v_doctor_id uuid;
begin
  v_doctor_id := auth.uid();

  if v_doctor_id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'Authentication required.'
    );
  end if;

  -- Validate active session for this doctor
  select * into v_session
  from public.patient_access_sessions
  where session_id = p_session_id
    and doctor_id = v_doctor_id
    and status = 'active';

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'No active authorized session found for this doctor.'
    );
  end if;

  -- Verify server-side expiration timestamp
  if v_session.expires_at < now() then
    update public.patient_access_sessions
    set status = 'expired'
    where id = v_session.id;

    return jsonb_build_object(
      'success', false,
      'error', 'Authorized access duration has expired.'
    );
  end if;

  -- Retrieve patient profile info
  select id, name, email, avatar, date_of_birth, blood_group into v_patient
  from public.profiles
  where id = v_session.patient_id;

  -- Retrieve patient reports
  select coalesce(jsonb_agg(to_jsonb(r.*) order by r.date desc nulls last, r.created_at desc), '[]'::jsonb)
  into v_records
  from public.reports r
  where r.user_id = v_session.patient_id;

  return jsonb_build_object(
    'success', true,
    'sessionId', v_session.session_id,
    'expiresAt', v_session.expires_at,
    'patient', jsonb_build_object(
      'id', v_patient.id,
      'name', coalesce(v_patient.name, 'Patient'),
      'avatar', v_patient.avatar,
      'dateOfBirth', v_patient.date_of_birth,
      'bloodGroup', v_patient.blood_group
    ),
    'records', v_records
  );
end;
$$;


-- 4. SECURITY DEFINER RPC: end_doctor_access_session
create or replace function public.end_doctor_access_session(
  p_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doctor_id uuid;
begin
  v_doctor_id := auth.uid();

  update public.patient_access_sessions
  set
    status = 'revoked',
    revoked_at = now()
  where session_id = p_session_id
    and (doctor_id = v_doctor_id or patient_id = v_doctor_id);

  return jsonb_build_object('success', true);
end;
$$;
