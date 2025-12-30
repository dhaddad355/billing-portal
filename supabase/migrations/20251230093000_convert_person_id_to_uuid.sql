BEGIN;

-- Drop dependent constraints before altering column types
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_person_id_fkey;
ALTER TABLE public.statements DROP CONSTRAINT IF EXISTS statements_person_id_fkey;
ALTER TABLE public.persons DROP CONSTRAINT IF EXISTS persons_pkey;

-- Prepare new UUID columns
ALTER TABLE public.persons ADD COLUMN person_id_uuid uuid;
UPDATE public.persons
SET person_id_uuid = md5(person_id::text)::uuid;
ALTER TABLE public.persons ALTER COLUMN person_id_uuid SET NOT NULL;

ALTER TABLE public.statements ADD COLUMN person_id_uuid uuid;
UPDATE public.statements s
SET person_id_uuid = md5(s.person_id::text)::uuid;
ALTER TABLE public.statements ALTER COLUMN person_id_uuid SET NOT NULL;

ALTER TABLE public.messages ADD COLUMN person_id_uuid uuid;
UPDATE public.messages m
SET person_id_uuid = md5(m.person_id::text)::uuid
WHERE m.person_id IS NOT NULL;

-- Rebuild indexes that depend on legacy integer column
DROP INDEX IF EXISTS public.idx_statements_person_status;

-- Remove legacy integer columns
ALTER TABLE public.messages DROP COLUMN person_id;
ALTER TABLE public.statements DROP COLUMN person_id;
ALTER TABLE public.persons DROP COLUMN person_id;

-- Rename UUID columns to original names
ALTER TABLE public.persons RENAME COLUMN person_id_uuid TO person_id;
ALTER TABLE public.statements RENAME COLUMN person_id_uuid TO person_id;
ALTER TABLE public.messages RENAME COLUMN person_id_uuid TO person_id;

-- Recreate primary and foreign key constraints
ALTER TABLE public.persons ADD CONSTRAINT persons_pkey PRIMARY KEY (person_id);

ALTER TABLE public.statements
  ADD CONSTRAINT statements_person_id_fkey FOREIGN KEY (person_id)
  REFERENCES public.persons(person_id);

ALTER TABLE public.messages
  ADD CONSTRAINT messages_person_id_fkey FOREIGN KEY (person_id)
  REFERENCES public.persons(person_id);

-- Restore supporting indexes
CREATE INDEX idx_statements_person_status ON public.statements (person_id, status);

COMMIT;
