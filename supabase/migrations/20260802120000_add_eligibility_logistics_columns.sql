-- Structured eligibility + logistics columns for the matching engine.
-- All nullable: null = "not yet verified / no restriction". Populated over time
-- by the verification workflow (see supabase/VERIFICATION.md).
-- Applied to the live project on 2026-08-02 via MCP (add_eligibility_logistics_columns).

ALTER TABLE public."Internships"
  ADD COLUMN IF NOT EXISTS min_age smallint,
  ADD COLUMN IF NOT EXISTS max_age smallint,
  ADD COLUMN IF NOT EXISTS required_gender text,
  ADD COLUMN IF NOT EXISTS location_eligibility jsonb,
  ADD COLUMN IF NOT EXISTS housing text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_count integer NOT NULL DEFAULT 0;

ALTER TABLE public."Internships"
  ADD CONSTRAINT internships_required_gender_check
    CHECK (required_gender IS NULL OR required_gender IN ('female','male','nonbinary')),
  ADD CONSTRAINT internships_housing_check
    CHECK (housing IS NULL OR housing IN ('provided','optional','none')),
  ADD CONSTRAINT internships_age_range_check
    CHECK (min_age IS NULL OR max_age IS NULL OR min_age <= max_age),
  ADD CONSTRAINT internships_min_age_sane_check
    CHECK (min_age IS NULL OR (min_age BETWEEN 10 AND 21)),
  ADD CONSTRAINT internships_location_eligibility_is_array_check
    CHECK (location_eligibility IS NULL OR jsonb_typeof(location_eligibility) = 'array');

COMMENT ON COLUMN public."Internships".min_age IS 'Minimum age required (e.g. 16 for "must be 16+"). NULL = no age minimum. Distinct from grade eligibility.';
COMMENT ON COLUMN public."Internships".max_age IS 'Maximum age allowed (rare). NULL = no maximum.';
COMMENT ON COLUMN public."Internships".required_gender IS 'Only set when the program explicitly restricts to one gender (e.g. "girls only"): female | male | nonbinary. NULL = open to all.';
COMMENT ON COLUMN public."Internships".location_eligibility IS 'JSON array of places a student may live/attend school to be eligible; matching ANY entry qualifies. Entry: {"type":"state|city|county|zip|district|region","value":"<name or zip>","state":"XX"}. NULL = no residency restriction. Supersedes the free-text Required_State column.';
COMMENT ON COLUMN public."Internships".housing IS 'For in-person programs: provided = dorms/housing included, optional = housing available for a fee/on request, none = student must commute or arrange own housing. NULL = unknown or remote.';
COMMENT ON COLUMN public."Internships".verified_at IS 'Timestamp of the last verification pass over this row.';
COMMENT ON COLUMN public."Internships".verification_count IS 'How many verification passes this row has received. Used to skip low-value re-verification of cosmetic fields.';
