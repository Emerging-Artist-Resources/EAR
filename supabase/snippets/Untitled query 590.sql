-- Optional class/workshop duration (e.g. "60 minutes", "3-day intensive")
alter table "public"."class_workshop_details"
  add column if not exists "duration" text;