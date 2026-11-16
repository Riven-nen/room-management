-- 001_add_roles.sql
-- Adds the new role values used by the role-based access model.
-- Kept in its own migration because PostgreSQL does not allow a newly added
-- enum value to be used in the same transaction.
--
-- Existing 'teacher' rows are left untouched and treated as 'faculty' by the
-- application until 003_convert_teacher_role.sql is run after deployment.

alter type user_role add value if not exists 'faculty';
alter type user_role add value if not exists 'mis_staff';
