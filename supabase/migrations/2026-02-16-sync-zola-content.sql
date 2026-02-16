insert into public.events (title, location, start_at, end_at, sort_order)
values
  ('Ceremony', 'The Fenway Hotel Front Lawn', '2026-03-14T21:30:00Z', '2026-03-14T22:00:00Z', 1),
  ('Cocktail Hour', 'Caladesi Terrace', '2026-03-14T22:00:00Z', '2026-03-14T23:00:00Z', 2),
  ('Reception', 'Front Lawn', '2026-03-14T23:00:00Z', '2026-03-15T03:00:00Z', 3),
  ('After Party', 'Location shared closer to wedding', '2026-03-15T03:00:00Z', '2026-03-15T06:00:00Z', 4)
on conflict (sort_order) do update
set
  title = excluded.title,
  location = excluded.location,
  start_at = excluded.start_at,
  end_at = excluded.end_at;

delete from public.events
where sort_order > 4;

insert into public.guide_items (title, category, description, address, maps_url, sort_order)
values
  (
    'Fenway Hotel Room Block',
    'Stay',
    'Discounted group rate at Fenway Hotel. Book with the room-block link for group pricing.',
    '453 Edgewater Drive, Dunedin, FL 34698',
    'https://www.marriott.com/event-reservations/reservation-link.mi?id=1740088122132&key=GRP&guestreslink2=true&app=resvlink',
    1
  ),
  (
    'Closest Airports',
    'Travel',
    'Fly into Tampa International (TPA) or St. Pete-Clearwater (PIE). Rental cars are recommended, and Uber/Lyft are widely available.',
    'Tampa Bay Area Airports',
    'https://maps.google.com/?q=Tampa+International+Airport',
    2
  ),
  (
    'Alternative Hotels',
    'Stay',
    'Best Western Plus Yacht Harbor Inn, Holiday Inn Express & Suites Clearwater North/Dunedin, plus nearby options via Zola hotel search.',
    'Dunedin + Clearwater Area',
    'https://hotelblocks.zola.com/Search/?City=Dunedin+FL&inDate=03/13/2026&outDate=03/15/2026',
    3
  ),
  (
    'Vacation Rentals',
    'Stay',
    'Airbnb and VRBO options in Dunedin and Clearwater Beach are great alternatives (about a 15-25 minute drive).',
    'Dunedin, FL',
    'https://maps.google.com/?q=Downtown+Dunedin',
    4
  ),
  (
    'Local Dunedin Activities',
    'Explore',
    'Browse curated local activities for downtime around the weekend.',
    null,
    'https://www.fenwayhotel.com/activities/',
    5
  )
on conflict (sort_order) do update
set
  title = excluded.title,
  category = excluded.category,
  description = excluded.description,
  address = excluded.address,
  maps_url = excluded.maps_url;
