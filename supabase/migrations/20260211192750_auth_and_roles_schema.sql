BEGIN;

-- 1. Create a profiles table to handle roles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Cobros', 'Tecnico', 'SuperAdmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Update existing tables to restrict access based on roles (Simplified for MVP)
-- In a real scenario, we'd use: USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin'))
-- For now, we keep the "Allow all" policies but we will enforce role-based UI logic.

COMMIT;