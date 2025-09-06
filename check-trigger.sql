-- Check if the trigger function exists
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_profile_for_user';

-- Check if the trigger exists
SELECT 
    t.tgname as trigger_name,
    t.tgrelid::regclass as table_name,
    t.tgenabled as enabled
FROM pg_trigger t
WHERE tgname = 'on_auth_user_created';
