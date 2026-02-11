BEGIN;

-- Insert Sample Clients
INSERT INTO clients (name, email, phone, address, plan, status) VALUES
('Juan Pérez', 'juan@example.com', '+123456789', 'Calle Luna 123, Madrid', '100 Mbps Fibra', 'Activo'),
('María García', 'maria@example.com', '+987654321', 'Av. Sol 456, Barcelona', '300 Mbps Simétrico', 'Pendiente'),
('Carlos Ruiz', 'carlos@example.com', '+112233445', 'Plaza Mayor 7, Sevilla', '50 Mbps Básico', 'Inactivo');

-- Insert Sample Installers
INSERT INTO installers (name, email, phone, status) VALUES
('Roberto Gómez', 'roberto@wifi.com', '+5550101', 'En Ruta'),
('Ana Martínez', 'ana@wifi.com', '+5550102', 'Disponible'),
('Luis Torres', 'luis@wifi.com', '+5550103', 'Fuera de Servicio');

-- Insert Sample Support Tickets
INSERT INTO support_tickets (client_id, issue, description, priority, status)
SELECT id, 'Sin conexión a internet', 'El router parpadea en rojo desde hace 2 horas.', 'Alta', 'Abierto'
FROM clients WHERE name = 'Juan Pérez' LIMIT 1;

INSERT INTO support_tickets (client_id, issue, description, priority, status)
SELECT id, 'Lentitud en el servicio', 'Solo recibo 10 Mbps de los 300 contratados.', 'Media', 'En Proceso'
FROM clients WHERE name = 'María García' LIMIT 1;

COMMIT;