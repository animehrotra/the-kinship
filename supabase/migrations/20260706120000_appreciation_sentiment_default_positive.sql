-- All appreciation_responses rows are now implicitly positive; negative
-- ("Not really") responses with text are routed to the feedback table instead.
-- Give sentiment a default so the app can stop populating it on insert
-- without breaking the existing NOT NULL constraint. Column is kept for
-- backward compatibility with historical rows.
ALTER TABLE public.appreciation_responses
  ALTER COLUMN sentiment SET DEFAULT 'positive';
