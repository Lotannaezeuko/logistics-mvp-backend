CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manufacturer', 'haulier', 'logistics_company')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Making the additional tables for the types of users
CREATE TABLE manufacturers (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  years_in_business INT,
  product_type TEXT,
  target_areas TEXT
);

-- Hauliers
CREATE TABLE hauliers (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  fleet_size INT,
  preferred_routes TEXT,
  insurance_valid_until DATE
);

-- Logistics Companies
CREATE TABLE logistics_companies (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  company_size INT,
  specialties TEXT,
  target_lanes TEXT
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

-- making a new table to store the documents uploaded by users
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- e.g., 'insurance_certificate', 'operators_license', etc.
  document_category TEXT NOT NULL, -- e.g., 'insurance', 'license', 'certification'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Local path or S3 URL
  file_size INTEGER, -- in bytes
  mime_type TEXT,
  expiry_date DATE, -- NULL if document doesn't expire
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id), -- For admin verification (future feature)
  notes TEXT -- For admin notes or rejection reasons
);