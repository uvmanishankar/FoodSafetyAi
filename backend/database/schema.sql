CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    is_banned INTEGER DEFAULT 0,
    source TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS laboratories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    contact_number TEXT,
    accreditation TEXT
);

CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT,
    batch_number TEXT,
    issue_description TEXT,
    status TEXT DEFAULT 'Pending',
    image_url TEXT,
    user_contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed some banned ingredients
INSERT OR IGNORE INTO ingredients (name, is_banned, source, details) VALUES
('D-ribose', 1, 'FSSAI', 'Banned in nutraceuticals'),
('Ipriflavone', 1, 'FSSAI', 'Banned in nutraceuticals'),
('Polypodium leucotomos', 1, 'FSSAI', 'Banned in nutraceuticals'),
('Potassium bromate', 1, 'FSSAI', 'Banned food additive'),
('Cyclamates', 1, 'FSSAI', 'Banned artificial sweetener');
