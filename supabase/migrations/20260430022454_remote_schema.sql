alter table "public"."profiles" alter column "role" drop default;

alter table "public"."profiles" alter column role type "public"."user_role" using role::text::"public"."user_role";

alter table "public"."profiles" alter column "role" set default 'user'::public.user_role;

alter table "public"."profiles" alter column "role" set default 'admin'::public.user_role;


