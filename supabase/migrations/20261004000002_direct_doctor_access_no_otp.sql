-- ==============================================================================
-- Vital Diary Database Migration: Direct Doctor QR Access & Medical Records Access
-- Self-contained migration: Creates patient_access_sessions, RLS policies, Storage permissions, and SECURITY DEFINER RPCs
-- ==============================================================================

-- 1. Create patient_access_sessions Table if not exists
create table if not exists public.patient_access_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  otp_code text default '',
  duration_minutes integer not null default 30,
  expires_at timestamp with time zone not null,
  doctor_id uuid references public.profiles(id),
  doctor_name text,
  status text not null default 'pending' check (status in ('pending', 'waiting_scan', 'active', 'expired', 'revoked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  accessed_at timestamp with time zone,
  revoked_at timestamp with time zone
);

-- Ensure otp_code is nullable
alter table public.patient_access_sessions 
  alter column otp_code drop not null;

alter table public.patient_access_sessions 
  alter column otp_code set default '';

-- Create indexes for high performance lookups
create index if not exists idx_patient_access_sessions_session_id on public.patient_access_sessions(session_id);
create index if not exists idx_patient_access_sessions_expires_at on public.patient_access_sessions(expires_at);
create index if not exists idx_patient_access_sessions_patient_id on public.patient_access_sessions(patient_id);
create index if not exists idx_patient_access_sessions_doctor_id on public.patient_access_sessions(doctor_id);

-- Enable RLS for patient_access_sessions
alter table public.patient_access_sessions enable row level security;

-- 2. Access session RLS policies
drop policy if exists "Patients can view their own access sessions" on public.patient_access_sessions;
drop policy if exists "Patients can insert their own access sessions" on public.patient_access_sessions;
drop policy if exists "Patients can update their own access sessions" on public.patient_access_sessions;
drop policy if exists "Doctors can view active sessions they are assigned to" on public.patient_access_sessions;
drop policy if exists "Allow session lookup by session_id" on public.patient_access_sessions;
drop policy if exists "Allow doctor update on access sessions" on public.patient_access_sessions;

create policy "Allow session lookup by session_id"
  on public.patient_access_sessions for select
  using (true);

create policy "Patients can insert their own access sessions"
  on public.patient_access_sessions for insert
  with check (auth.uid() = patient_id or auth.uid() is null);

create policy "Allow doctor update on access sessions"
  on public.patient_access_sessions for update
  using (true);

-- 3. Unified RLS policy on public.reports:
-- Allows patient to view own reports AND allows doctors with an active unexpired session to view patient's existing reports
alter table public.reports enable row level security;

drop policy if exists "Users can view their own reports" on public.reports;
drop policy if exists "Authorized doctors can view patient reports" on public.reports;
drop policy if exists "Allow reading reports by owner or active session" on public.reports;

create policy "Allow reading reports by owner or active session"
  on public.reports for select
  using (
    -- 1. Owner of report
    auth.uid() = user_id
    -- 2. Doctor / user with active unexpired session for this patient
    or exists (
      select 1 from public.patient_access_sessions pas
      where pas.patient_id = public.reports.user_id
        and pas.status = 'active'
        and pas.expires_at > now()
    )
  );

-- 4. Storage RLS policy on storage.objects for bucket 'medical-files':
-- Allows patient to read own files AND allows doctors with active session to read/sign patient PDF files
drop policy if exists "Users can read own medical files" on storage.objects;
drop policy if exists "Allow reading medical files by owner or active session" on storage.objects;

create policy "Allow reading medical files by owner or active session"
  on storage.objects for select
  using (
    bucket_id = 'medical-files'
    and (
      (auth.uid()::text = (storage.foldername(name))[1])
      or exists (
        select 1 from public.patient_access_sessions pas
        where pas.patient_id::text = (storage.foldername(name))[1]
          and pas.status = 'active'
          and pas.expires_at > now()
      )
    )
  );

-- 5. SECURITY DEFINER RPC: grant_doctor_direct_access
-- Directly activates access session for scanning doctor without OTP, saving doctor's identity and start/expiry times
create or replace function public.grant_doctor_direct_access(
  p_session_id text,
  p_doctor_id text default null,
  p_doctor_name text default null
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
  v_expires_at timestamp with time zone;
begin
  -- Resolve doctor UUID if valid
  v_doctor_id := auth.uid();
  if v_doctor_id is null and p_doctor_id is not null then
    begin
      v_doctor_id := p_doctor_id::uuid;
    exception when others then
      v_doctor_id := null;
    end;
  end if;
  
  if v_doctor_id is not null then
    select name into v_doctor_name from public.profiles where id = v_doctor_id;
  end if;

  v_doctor_name := coalesce(v_doctor_name, nullif(trim(p_doctor_name), ''), 'Dr. Healthcare Provider');

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

  -- Check if revoked
  if v_session.status = 'revoked' then
    return jsonb_build_object(
      'success', false,
      'error', 'This access session was revoked by the patient.'
    );
  end if;

  -- Calculate expiration from current time + duration_minutes
  v_expires_at := now() + (coalesce(v_session.duration_minutes, 30) * interval '1 minute');

  -- Activate session for this doctor
  update public.patient_access_sessions
  set
    doctor_id = coalesce(v_doctor_id, doctor_id),
    doctor_name = v_doctor_name,
    status = 'active',
    expires_at = v_expires_at,
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
    'doctor', jsonb_build_object(
      'id', coalesce(v_doctor_id::text, v_session.doctor_id::text, p_doctor_id, 'DOC-AUTH'),
      'name', v_doctor_name
    ),
    'patient', jsonb_build_object(
      'id', coalesce(v_patient.id, v_session.patient_id),
      'name', coalesce(v_patient.name, 'Authorized Patient'),
      'email', v_patient.email,
      'avatar', v_patient.avatar,
      'dateOfBirth', v_patient.date_of_birth,
      'bloodGroup', v_patient.blood_group
    )
  );
end;
$$;

-- 6. SECURITY DEFINER RPC: get_authorized_patient_records
-- Securely retrieves medical records for a patient ONLY while session is active and unexpired.
create or replace function public.get_authorized_patient_records(
  p_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_session record;
  v_patient record;
  v_records jsonb;
  v_doctor_id uuid;
begin
  v_doctor_id := auth.uid();

  -- Find active session
  select * into v_session
  from public.patient_access_sessions
  where session_id = p_session_id
    and status = 'active';

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'No active authorized session found for this QR code.'
    );
  end if;

  -- Check expiration timestamp
  if v_session.expires_at < now() then
    update public.patient_access_sessions
    set status = 'expired'
    where id = v_session.id;

    return jsonb_build_object(
      'success', false,
      'error', 'Authorized access duration has expired.'
    );
  end if;

  -- If doctor is authenticated and doctor_id is not yet set, update it
  if v_doctor_id is not null and (v_session.doctor_id is null or v_session.doctor_id != v_doctor_id) then
    update public.patient_access_sessions
    set doctor_id = v_doctor_id
    where id = v_session.id;
  end if;

  -- Retrieve patient profile info
  select id, name, email, avatar, date_of_birth, blood_group into v_patient
  from public.profiles
  where id = v_session.patient_id;

  -- Retrieve all existing reports of this patient
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'user_id', r.user_id,
        'title', r.title,
        'category', r.category,
        'provider', r.provider,
        'doctor', r.doctor,
        'date', r.date,
        'file_name', r.file_name,
        'file_size', r.file_size,
        'file_type', r.file_type,
        'file_path', r.file_path,
        'folder_name', r.folder_name,
        'relative_path', r.relative_path,
        'tags', r.tags,
        'notes', r.notes,
        'status', r.status,
        'ocr_confidence', r.ocr_confidence,
        'ocr_source', r.ocr_source,
        'is_medical_report', r.is_medical_report,
        'validation_message', r.validation_message,
        'extracted_metrics', r.extracted_metrics,
        'results', r.results,
        'created_at', r.created_at,
        'updated_at', r.updated_at
      )
      order by r.date desc nulls last, r.created_at desc
    ),
    '[]'::jsonb
  )
  into v_records
  from public.reports r
  where r.user_id = v_session.patient_id;

  return jsonb_build_object(
    'success', true,
    'sessionId', v_session.session_id,
    'expiresAt', v_session.expires_at,
    'patient', jsonb_build_object(
      'id', coalesce(v_patient.id, v_session.patient_id),
      'name', coalesce(v_patient.name, 'Authorized Patient'),
      'email', v_patient.email,
      'avatar', v_patient.avatar,
      'dateOfBirth', v_patient.date_of_birth,
      'bloodGroup', v_patient.blood_group
    ),
    'records', v_records
  );
end;
$$;

-- 7. SECURITY DEFINER RPC: end_doctor_access_session
create or replace function public.end_doctor_access_session(
  p_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  update public.patient_access_sessions
  set
    status = 'revoked',
    revoked_at = now()
  where session_id = p_session_id
    and (doctor_id = v_user_id or patient_id = v_user_id or v_user_id is null);

  return jsonb_build_object('success', true);
end;
$$;
