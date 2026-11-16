-- 003_convert_teacher_role.sql
-- Run this only AFTER the new backend (which understands 'faculty') is live.
-- It converts the legacy 'teacher' accounts to the new 'faculty' role.

update users set role = 'faculty' where role = 'teacher';
