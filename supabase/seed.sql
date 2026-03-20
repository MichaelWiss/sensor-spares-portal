-- ═══════════════════════════════════════════════════════════════
-- Sensor Spares Portal — Seed Data
-- ═══════════════════════════════════════════════════════════════
-- Run with: supabase db reset (applies migration + seed)

-- ───────────────────────────────────────────────
-- Companies
-- ───────────────────────────────────────────────

insert into companies (id, name, billing_line1, billing_city, billing_state, billing_postal) values
  ('a0000000-0000-0000-0000-000000000001', 'Acme Manufacturing', '100 Industrial Blvd', 'Houston', 'TX', '77001'),
  ('a0000000-0000-0000-0000-000000000002', 'Gulf Coast Refining', '500 Refinery Row', 'Beaumont', 'TX', '77701');

-- ───────────────────────────────────────────────
-- Sensor Models (5)
-- ───────────────────────────────────────────────

insert into models (id, name, manufacturer, sensor_type, description) values
  ('b0000000-0000-0000-0000-000000000001', 'ST800 Pressure Transmitter',    'Honeywell',      'pressure',    'SmartLine differential pressure transmitter for process applications'),
  ('b0000000-0000-0000-0000-000000000002', 'Rosemount 3051S',               'Emerson',         'pressure',    'Scalable pressure transmitter with HART/Foundation Fieldbus'),
  ('b0000000-0000-0000-0000-000000000003', 'RTD PT100 Temperature Probe',   'Endress+Hauser',  'temperature', 'Pt100 resistance temperature detector, -200°C to +600°C'),
  ('b0000000-0000-0000-0000-000000000004', 'Promag 400 Electromagnetic',    'Endress+Hauser',  'flow',        'Electromagnetic flowmeter for conductive liquids'),
  ('b0000000-0000-0000-0000-000000000005', 'Vibration Sensor 9200',         'Bently Nevada',   'vibration',   'Proximity vibration probe for rotating machinery monitoring');

-- ───────────────────────────────────────────────
-- Parts (20 spare parts)
-- ───────────────────────────────────────────────

insert into parts (id, sku, name, manufacturer, sensor_type, base_price_cents, stock_quantity, lead_time_days, safety_stock, weight_grams) values
  -- Pressure transmitter parts
  ('c0000000-0000-0000-0000-000000000001', 'HW-ST800-DIAP',   'ST800 Diaphragm Assembly',        'Honeywell',      'pressure',    45000,  24, 5,  10, 340),
  ('c0000000-0000-0000-0000-000000000002', 'HW-ST800-SEAL',   'ST800 Process Seal Kit',           'Honeywell',      'pressure',    12500,  80, 3,  20, 120),
  ('c0000000-0000-0000-0000-000000000003', 'HW-ST800-ELEC',   'ST800 Electronics Module',         'Honeywell',      'pressure',    89000,   8, 10, 5,  280),
  ('c0000000-0000-0000-0000-000000000004', 'HW-ST800-GSKT',   'ST800 Gasket Set (10-pack)',       'Honeywell',      'pressure',     3500, 200, 2,  50, 85),
  ('c0000000-0000-0000-0000-000000000005', 'EM-3051-DIAP',    'Rosemount 3051 Diaphragm',         'Emerson',         'pressure',    52000,  15, 7,  8,  360),
  ('c0000000-0000-0000-0000-000000000006', 'EM-3051-ELEC',    'Rosemount 3051 Electronics',       'Emerson',         'pressure',    95000,   5, 12, 3,  290),
  ('c0000000-0000-0000-0000-000000000007', 'EM-3051-MNFLD',   'Rosemount 3-Valve Manifold',       'Emerson',         'pressure',    18000,  40, 3,  15, 450),
  ('c0000000-0000-0000-0000-000000000008', 'GN-PRES-GSKT',    'Universal Pressure Gasket Kit',    'GenSeal',         'pressure',     2800, 300, 1,  75, 60),

  -- Temperature parts
  ('c0000000-0000-0000-0000-000000000009', 'EH-RTD-ELEM',     'PT100 RTD Element',                'Endress+Hauser',  'temperature', 15000,  50, 3,  20, 45),
  ('c0000000-0000-0000-0000-000000000010', 'EH-RTD-WELL',     'Thermowell 316SS',                 'Endress+Hauser',  'temperature', 22000,  30, 5,  10, 380),
  ('c0000000-0000-0000-0000-000000000011', 'EH-RTD-HEAD',     'Connection Head Assembly',          'Endress+Hauser',  'temperature',  8500,  45, 3,  15, 220),
  ('c0000000-0000-0000-0000-000000000012', 'GN-RTD-WIRE',     'RTD Extension Wire (25m)',          'TempCable Co',    'temperature',  4200, 120, 2,  30, 650),

  -- Flow parts
  ('c0000000-0000-0000-0000-000000000013', 'EH-PM400-LINER',  'Promag 400 PTFE Liner',            'Endress+Hauser',  'flow',        67000,  10, 14, 4,  1200),
  ('c0000000-0000-0000-0000-000000000014', 'EH-PM400-ELEC',   'Promag 400 Transmitter Module',    'Endress+Hauser',  'flow',       120000,   3, 21, 2,  850),
  ('c0000000-0000-0000-0000-000000000015', 'EH-PM400-COIL',   'Promag 400 Coil Assembly',         'Endress+Hauser',  'flow',        45000,  12, 10, 5,  600),
  ('c0000000-0000-0000-0000-000000000016', 'GN-FLOW-GSKT',    'Mag Flow Gasket Set',              'GenSeal',         'flow',         5500, 150, 1,  40, 95),

  -- Vibration parts
  ('c0000000-0000-0000-0000-000000000017', 'BN-9200-PROBE',   'Proximity Probe 8mm',              'Bently Nevada',   'vibration',   35000,  20, 7,  8,  75),
  ('c0000000-0000-0000-0000-000000000018', 'BN-9200-DRVR',    'Proximitor Driver Module',         'Bently Nevada',   'vibration',   78000,   6, 14, 3,  180),
  ('c0000000-0000-0000-0000-000000000019', 'BN-9200-CABLE',   'Extension Cable 5m',               'Bently Nevada',   'vibration',   12000,  35, 5,  12, 250),
  ('c0000000-0000-0000-0000-000000000020', 'GN-VIB-MOUNT',    'Universal Vibration Mount Kit',    'MountTech',       'vibration',    6500, 100, 2,  25, 320);

-- ───────────────────────────────────────────────
-- Compatibility (model → part edges)
-- ───────────────────────────────────────────────

insert into compatibility (model_id, part_id, fit_type, notes) values
  -- ST800 → its parts (exact fit)
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'exact',       'OEM diaphragm'),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'exact',       'OEM seal kit'),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'exact',       'OEM electronics'),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'exact',       'OEM gasket set'),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 'aftermarket', 'Generic gasket — verify pressure rating'),

  -- Rosemount 3051 → its parts
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'exact',       'OEM diaphragm'),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006', 'exact',       'OEM electronics'),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 'exact',       'OEM manifold'),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000008', 'aftermarket', 'Generic gasket — verify pressure rating'),

  -- Cross-compatible: ST800 diaphragm works as equivalent in 3051
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'equivalent',  'Requires adapter plate HW-ADP-305'),

  -- RTD PT100 → its parts
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000009', 'exact',       'OEM RTD element'),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000010', 'exact',       'OEM thermowell'),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000011', 'exact',       'OEM connection head'),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000012', 'aftermarket', 'Third-party wire — verify 3-wire/4-wire config'),

  -- Promag 400 → its parts
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000013', 'exact',       'OEM liner'),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000014', 'exact',       'OEM transmitter module'),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000015', 'exact',       'OEM coil assembly'),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000016', 'exact',       'OEM gasket set'),

  -- Vibration Sensor 9200 → its parts
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000017', 'exact',       'OEM proximity probe'),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000018', 'exact',       'OEM driver module'),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000019', 'exact',       'OEM extension cable'),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000020', 'aftermarket', 'Generic mount — verify thread size M8/M10');

-- ───────────────────────────────────────────────
-- Contracts (2 — one Gold, one Silver)
-- ───────────────────────────────────────────────

insert into contracts (id, company_id, tier, discount_percent, starts_at, expires_at, is_active) values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'gold',   15.00, '2026-01-01', '2027-01-01', true),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'silver',  8.00, '2026-01-01', '2026-12-31', true);

-- Volume breaks for Gold contract
insert into contract_tiers (contract_id, min_quantity, additional_discount_percent) values
  ('d0000000-0000-0000-0000-000000000001', 10,  2.00),
  ('d0000000-0000-0000-0000-000000000001', 50,  5.00),
  ('d0000000-0000-0000-0000-000000000001', 100, 8.00);

-- Volume breaks for Silver contract
insert into contract_tiers (contract_id, min_quantity, additional_discount_percent) values
  ('d0000000-0000-0000-0000-000000000002', 25, 2.00),
  ('d0000000-0000-0000-0000-000000000002', 100, 4.00);

-- ───────────────────────────────────────────────
-- Suppliers (3)
-- ───────────────────────────────────────────────

insert into suppliers (id, name, contact_email, contact_phone, lead_time_days) values
  ('e0000000-0000-0000-0000-000000000001', 'Honeywell Process Solutions', 'orders@honeywell.com',     '+1-800-328-5111', 7),
  ('e0000000-0000-0000-0000-000000000002', 'Emerson Automation',          'parts@emerson.com',        '+1-800-999-9307', 10),
  ('e0000000-0000-0000-0000-000000000003', 'Industrial Spares Direct',    'sales@sparesdirect.com',   '+1-713-555-0199', 3);

-- Supplier ↔ Part mappings
insert into supplier_parts (supplier_id, part_id, cost_cents, lead_time_days, is_primary) values
  -- Honeywell supplies their own parts
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 32000, 7,  true),
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',  8500, 5,  true),
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 62000, 10, true),
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004',  2200, 3,  true),

  -- Emerson supplies their parts
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 37000, 10, true),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006', 68000, 14, true),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 12500, 5,  true),

  -- Industrial Spares Direct — aftermarket/generic parts (cheaper, faster)
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000008',  1500, 1, true),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000012',  2800, 2, true),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000016',  3200, 1, true),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000020',  4000, 2, true),
  -- Also supplies Honeywell parts (secondary, cheaper but slower)
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 28000, 14, false),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002',  7200, 7,  false);
