-- Vital Diary Database Migration: Direct Doctor Access (Zero OTP)
-- Makes otp_code optional / nullable in patient_access_sessions
-- Adds direct doctor grant RPC and updates get_authorized_patient_records

-- 1. Alter otp_code to be nullable with default ''
alter table if exists public.patient_access_sessions 
  alter column otp_code drop not null;

alter table if exists public.patient_access_sessions 
  alter column otp_code set default '';

-- 2. Ensure RLS policies allow doctor lookup and activation
drop policy if exists "Doctors can view active sessions they are assigned to" on public.patient_access_sessions;
drop policy if exists "Allow session lookup by session_id" on public.patient_access_sessions;

create policy "Allow session lookup by session_id"
  on public.patient_access_sessions for select
  using (true);

create policy "Allow doctor update on access sessions"
  on public.patient_access_sessions for update
  using (true);

-- 3. SECURITY DEFINER RPC: grant_doctor_direct_access
-- Directly activates access session for scanning doctor without OTP
create or replace function public.grant_doctor_direct_access(
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
  v_doctor_id uuid;
  v_doctor_name text;
  v_expires_at timestamp with time zone;
begin
  v_doctor_id := auth.uid();
  
  if v_doctor_id is not null then
    select name into v_doctor_name from public.profiles where id = v_doctor_id;
  end if;

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
    doctor_name = coalesce(v_doctor_name, doctor_name, 'Dr. Healthcare Provider'),
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
    'patient', jsonb_build_object(
      'id', coalesce(v_patient.id, v_session.patient_id),
      'name', coalesce(v_patient.name, 'Authorized Patient'),
      'avatar', v_patient.avatar,
      'dateOfBirth', v_patient.date_of_birth,
      'bloodGroup', v_patient.blood_group
    )
  );
end;
$$;
