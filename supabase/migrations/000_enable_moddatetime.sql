-- Enable the moddatetime extension for auto-updating updated_at columns.
-- In Supabase hosted, enable from Dashboard > Database > Extensions, or run:

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
