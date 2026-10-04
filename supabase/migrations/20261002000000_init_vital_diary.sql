-- Vital Diary Database Migration (NEW)
-- Tables: profiles, reports
-- Storage: private medical-files bucket with folder-level RLS

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  role text default 'patient' check (role in ('patient', 'doctor')),
  avatar text,
  specialty text,
  date_of_birth date,
  blood_group text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);


-- 2. REPORTS TABLE (Medical Reports & Documents)
create table if not exists public.reports (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'General Record',
  provider text,
  doctor text,
  date date,
  file_name text,
  file_size text,
  file_type text,
  file_path text, -- Stored as: {user_id}/{record_id}/{filename} in medical-files bucket
  folder_name text default 'Root Folder',
  relative_path text,
  tags text[] default '{}',
  notes text,
  status text default 'Verified',
  ocr_confidence numeric,
  ocr_source text,
  is_medical_report boolean default true,
  validation_message text,
  extracted_metrics jsonb default '[]'::jsonb,
  results jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for reports
alter table public.reports enable row level security;

create policy "Users can view their own reports"
  on public.reports for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reports"
  on public.reports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own reports"
  on public.reports for delete
  using (auth.uid() = user_id);


-- 3. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, avatar, specialty)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    coalesce(
      new.raw_user_meta_data->>'avatar',
      upper(substring(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 1, 2))
    ),
    new.raw_user_meta_data->>'specialty'
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, public.profiles.name),
    email = coalesce(excluded.email, public.profiles.email),
    role = coalesce(excluded.role, public.profiles.role),
    avatar = coalesce(excluded.avatar, public.profiles.avatar),
    specialty = coalesce(excluded.specialty, public.profiles.specialty),
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 4. PRIVATE STORAGE BUCKET: medical-files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medical-files',
  'medical-files',
  false,
  52428800, -- 50MB limit
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = false;

-- Storage RLS Policies
-- File path convention: {user_id}/{record_id}/{filename}
-- Users can only access files where the top-level folder matches auth.uid()

create policy "Users can upload their own medical files"
  on storage.objects for insert
  with check (
    bucket_id = 'medical-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own medical files"
  on storage.objects for select
  using (
    bucket_id = 'medical-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own medical files"
  on storage.objects for update
  using (
    bucket_id = 'medical-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own medical files"
  on storage.objects for delete
  using (
    bucket_id = 'medical-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
