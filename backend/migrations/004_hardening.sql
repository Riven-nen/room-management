-- 004_hardening.sql
-- Foundation fixes for the revamp:
--   * persistent express-session table
--   * consistent user/room/computer/notification id types
--   * wall-clock reservation times (Asia/Manila)
--   * database-level reservation overlap protection
--   * missing foreign-key/search indexes
--   * user lifecycle columns
--   * semester schedule room reference

-- ---------------------------------------------------------------------------
-- Persistent sessions (connect-pg-simple)
-- ---------------------------------------------------------------------------
create table if not exists session (
    sid varchar not null collate "default",
    sess json not null,
    expire timestamp(6) not null,
    constraint session_pkey primary key (sid) not deferrable
);

create index if not exists session_expire_idx on session (expire);

-- ---------------------------------------------------------------------------
-- User lifecycle / traceability
-- ---------------------------------------------------------------------------
alter table users add column if not exists is_active boolean not null default true;
alter table users add column if not exists created_at timestamptz not null default now();
alter table users add column if not exists updated_at timestamptz not null default now();
alter table users add column if not exists invite_code_id bigint references invite_codes(id) on delete set null;

create index if not exists users_role_idx on users (role);
create unique index if not exists users_email_lower_key on users (lower(email));

-- ---------------------------------------------------------------------------
-- Normalize time storage.
-- The app has always treated reservation times as wall-clock Asia/Manila.
-- `time_end` was stored as timestamptz, which made the same wall-clock value
-- appear as UTC. Preserve the displayed value, then use naive timestamps for
-- both endpoints.
-- ---------------------------------------------------------------------------
alter table reservations
    alter column time_end type timestamp without time zone
    using time_end at time zone 'UTC';

alter table reservations alter column status set default 'pending';

comment on column reservations.time_start is 'Wall-clock time in Asia/Manila';
comment on column reservations.time_end is 'Wall-clock time in Asia/Manila';

-- ---------------------------------------------------------------------------
-- Consistent id types across relationships
-- ---------------------------------------------------------------------------
alter table rooms drop constraint if exists rooms_coordinator_id_fkey;
alter table rooms alter column coordinator_id type bigint;
alter table rooms add constraint rooms_coordinator_id_fkey
    foreign key (coordinator_id) references users(id) on delete set null;

alter table computers drop constraint if exists computers_room_id_fkey;
alter table computers alter column room_id type bigint;
alter table computers add constraint computers_room_id_fkey
    foreign key (room_id) references rooms(id) on delete cascade;

alter table notifications drop constraint if exists notifications_user_id_fkey;
alter table notifications alter column user_id type bigint;
alter table notifications add constraint notifications_user_id_fkey
    foreign key (user_id) references users(id) on delete cascade;

update rooms set maintenance = false where maintenance is null;
alter table rooms alter column maintenance set default false;
alter table rooms alter column maintenance set not null;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists reservations_room_time_idx
    on reservations (room_id, time_start, time_end);
create index if not exists reservations_user_idx
    on reservations (reserved_by);
create index if not exists notifications_user_created_idx
    on notifications (user_id, created_at desc);
create index if not exists computers_room_idx
    on computers (room_id);

-- ---------------------------------------------------------------------------
-- Database-level double-booking protection
-- ---------------------------------------------------------------------------
create extension if not exists btree_gist;

alter table reservations
    add constraint reservations_no_overlap
    exclude using gist (
        room_id with =,
        tsrange(time_start, time_end) with &&
    )
    where (status not in ('rejected', 'cancelled'));

-- ---------------------------------------------------------------------------
-- Semester schedule: link to the actual room, keep the label for display
-- ---------------------------------------------------------------------------
alter table semesters add column if not exists starts_on date;
alter table semesters add column if not exists ends_on date;
alter table semesters add constraint semesters_dates_check
    check (ends_on is null or starts_on is null or ends_on >= starts_on);

alter table semester_schedules
    add column if not exists room_id bigint references rooms(id) on delete set null;

update semester_schedules
set room_id = rooms.id
from rooms
where semester_schedules.room_id is null
  and lower(trim(semester_schedules.room)) = lower(rooms.name);

create index if not exists semester_schedules_room_idx
    on semester_schedules (room_id, semester_id, day_of_week, start_time);
