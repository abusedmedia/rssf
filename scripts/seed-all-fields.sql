-- Demo form covering every field type. Safe to re-run locally.
INSERT OR IGNORE INTO users (id, google_sub, email, name, picture)
VALUES (
  'seed_user_all_fields',
  'seed-google-sub-all-fields',
  'seed@localhost',
  'Seed User',
  ''
);

DELETE FROM submissions WHERE form_id = 'seed_form_all_fields';
DELETE FROM forms WHERE id = 'seed_form_all_fields' OR slug = 'all-field-types';

INSERT INTO forms (
  id,
  owner_id,
  slug,
  schema_json,
  status,
  csv_export_enabled
)
VALUES (
  'seed_form_all_fields',
  COALESCE(
    (
      SELECT id
      FROM users
      WHERE google_sub != 'seed-google-sub-all-fields'
      ORDER BY created_at DESC
      LIMIT 1
    ),
    'seed_user_all_fields'
  ),
  'all-field-types',
  '{"version":1,"title":"All field types","description":"Local seed form so you can preview every input variant.","fields":[{"key":"full_name","type":"short_text","label":"Full name","required":true,"help":"short_text","options":[]},{"key":"about","type":"long_text","label":"About you","required":false,"help":"long_text","options":[]},{"key":"email","type":"email","label":"Email","required":true,"help":"email","options":[]},{"key":"party_size","type":"number","label":"Party size","required":true,"help":"number","options":[]},{"key":"event_date","type":"date","label":"Event date","required":true,"help":"date","options":[]},{"key":"country","type":"select","label":"Country","required":true,"help":"select","options":["Italy","Spain","France","Germany","Other"]},{"key":"tshirt_size","type":"single_choice","label":"T-shirt size","required":true,"help":"single_choice","options":["XS","S","M","L","XL"]},{"key":"interests","type":"multi_choice","label":"Interests","required":false,"help":"multi_choice","options":["Design","Engineering","Ops","Community"]},{"key":"subscribe","type":"yes_no","label":"Subscribe to updates","required":false,"help":"yes_no","options":[]}]}',
  'published',
  1
);
