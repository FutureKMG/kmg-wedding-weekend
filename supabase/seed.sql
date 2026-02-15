insert into public.events (title, location, start_at, end_at, sort_order)
values
  ('Ceremony', 'Front Lawn', '2026-03-14T21:30:00Z', '2026-03-14T22:00:00Z', 1),
  ('Cocktail Hour', 'Caladesi Terrace', '2026-03-14T22:00:00Z', '2026-03-14T23:00:00Z', 2),
  ('Reception', 'Front Lawn', '2026-03-14T23:00:00Z', '2026-03-15T02:00:00Z', 3),
  ('Late Night Snack', 'Reception Hall', '2026-03-15T02:00:00Z', '2026-03-15T03:00:00Z', 4),
  ('After Party', 'Lounge', '2026-03-15T03:00:00Z', '2026-03-15T05:00:00Z', 5)
on conflict (sort_order) do nothing;

insert into public.guide_items (title, category, description, address, maps_url, sort_order)
values
  (
    'Fenway Hotel Roof',
    'On Site',
    'A quick sunset reset spot between events.',
    '453 Edgewater Dr, Dunedin, FL 34698',
    'https://maps.google.com/?q=Fenway+Hotel+Dunedin',
    1
  ),
  (
    'Downtown Dunedin Walk',
    'Explore',
    'Boutiques, coffee, and waterfront views in a compact walkable area.',
    'Main St, Dunedin, FL 34698',
    'https://maps.google.com/?q=Downtown+Dunedin',
    2
  ),
  (
    'Caladesi Island Ferry',
    'Adventure',
    'A scenic daytime outing for guests staying through the weekend.',
    '1 Causeway Blvd, Dunedin, FL 34698',
    'https://maps.google.com/?q=Caladesi+Island+State+Park',
    3
  )
on conflict (sort_order) do nothing;
