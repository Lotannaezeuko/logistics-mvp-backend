CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manufacturer', 'haulier', 'freight_forwarder', 'logistics_company')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  weight FLOAT,
  price FLOAT,
  origin_address TEXT,
  origin_lat DECIMAL(10,7),
  origin_lng DECIMAL(10,7),
  destination_address TEXT,
  destination_lat DECIMAL(10,7),
  destination_lng DECIMAL(10,7),
  deadline TIMESTAMP,
  status TEXT DEFAULT 'open',
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  booked_by UUID REFERENCES users(id),
  status TEXT,
  booked_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  amount FLOAT,
  stripe_payment_intent TEXT,
  paid_to UUID REFERENCES users(id),
  paid_at TIMESTAMP,
  status TEXT
);