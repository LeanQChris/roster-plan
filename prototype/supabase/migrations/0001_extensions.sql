-- Extensions required by later migrations.
create extension if not exists "pgcrypto" with schema extensions; -- gen_random_uuid()
