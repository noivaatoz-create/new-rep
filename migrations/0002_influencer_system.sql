DO $$ BEGIN
  CREATE TYPE commission_type AS ENUM ('percentage', 'fixed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE influencer_status AS ENUM ('active', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_status AS ENUM ('pending', 'approved', 'paid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS influencers (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  commission_type commission_type NOT NULL,
  commission_value numeric(10,2) NOT NULL,
  status influencer_status NOT NULL DEFAULT 'active',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code text NOT NULL UNIQUE,
  influencer_id integer NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  discount_type discount_type NOT NULL,
  discount_value numeric(10,2) NOT NULL,
  usage_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  expires_at timestamp,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_codes_code_idx ON promo_codes(code);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS promo_code_id integer,
  ADD COLUMN IF NOT EXISTS influencer_id integer,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount numeric(10,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT orders_promo_code_id_fk FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT orders_influencer_id_fk FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS commissions (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  influencer_id integer NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  commission_amount numeric(10,2) NOT NULL,
  status commission_status NOT NULL DEFAULT 'pending',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
