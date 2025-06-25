-- Fix IAM Database Authentication for Pipeline Pulse
-- This SQL script grants the rds_iam role to the postgres user

-- Check if rds_iam role exists (should exist on RDS instances)
SELECT rolname FROM pg_roles WHERE rolname = 'rds_iam';

-- Check current roles for postgres user
SELECT r.rolname 
FROM pg_auth_members m 
JOIN pg_roles r ON m.roleid = r.oid 
JOIN pg_roles u ON m.member = u.oid 
WHERE u.rolname = 'postgres';

-- Grant rds_iam role to postgres user (this is the key fix)
GRANT rds_iam TO postgres;

-- Verify the grant was successful
SELECT r.rolname 
FROM pg_auth_members m 
JOIN pg_roles r ON m.roleid = r.oid 
JOIN pg_roles u ON m.member = u.oid 
WHERE u.rolname = 'postgres' AND r.rolname = 'rds_iam';

-- Show all roles for postgres user after the grant
SELECT r.rolname 
FROM pg_auth_members m 
JOIN pg_roles r ON m.roleid = r.oid 
JOIN pg_roles u ON m.member = u.oid 
WHERE u.rolname = 'postgres';
