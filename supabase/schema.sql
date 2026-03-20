-- positions table
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- sourcing_platforms table
CREATE TABLE sourcing_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- candidates table
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  url TEXT,
  sourcing_platform_id UUID REFERENCES sourcing_platforms(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'outbound_sent',
  outcome TEXT NOT NULL DEFAULT 'in_progress',
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some default positions
INSERT INTO positions (name) VALUES ('소프트웨어 엔지니어'), ('프로덕트 매니저'), ('디자이너'), ('마케터');

-- Insert some default platforms
INSERT INTO sourcing_platforms (name) VALUES ('LinkedIn'), ('Wanted'), ('Jumpit'), ('Blind'), ('직접 연락');
