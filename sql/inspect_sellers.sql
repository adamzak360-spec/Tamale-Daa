SELECT policyname, cmd, roles, qual::text, with_check::text
FROM pg_policies WHERE tablename = 'sellers';
