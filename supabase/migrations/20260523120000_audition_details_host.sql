-- Hosting organization / individual(s) for audition listings (nullable for existing rows)
alter table "public"."audition_details" add column if not exists "host" text;

comment on column "public"."audition_details"."host" is 'Hosting organization or individual(s) presenting the audition';
