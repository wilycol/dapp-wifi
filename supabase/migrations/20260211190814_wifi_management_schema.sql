BEGIN;

-- Create Enums
CREATE TYPE client_status AS ENUM ('Activo', 'Pendiente', 'Inactivo');
CREATE TYPE installer_status AS ENUM ('Disponible', 'En Ruta', 'Fuera de Servicio');
CREATE TYPE ticket_status AS ENUM ('Abierto', 'En Proceso', 'Cerrado');
CREATE TYPE ticket_priority AS ENUM ('Baja', 'Media', 'Alta');

-- Create Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT NOT NULL,
    plan TEXT NOT NULL,
    status client_status DEFAULT 'Pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Installers Table
CREATE TABLE installers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    status installer_status DEFAULT 'Disponible',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Support Tickets Table
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    issue TEXT NOT NULL,
    description TEXT,
    priority ticket_priority DEFAULT 'Media',
    status ticket_status DEFAULT 'Abierto',
    assigned_installer_id UUID REFERENCES installers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public for now as per starter template simplicity, but restricted to authenticated in real scenarios)
CREATE POLICY "Allow all access to clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to installers" ON installers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to support_tickets" ON support_tickets FOR ALL USING (true) WITH CHECK (true);

COMMIT;