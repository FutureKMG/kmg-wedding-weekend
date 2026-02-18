export const DASHBOARD_TEXT_DEFAULTS = {
  'layout.eyebrow': 'The Gilmore Wedding Weekend',
  'layout.meta': 'March 13-15 · Tampa, Florida',
  'layout.title': 'Welcome, {GuestFirstName}.',
  'layout.subtitle': 'Your personal concierge for the weekend.',

  'home.need.eyebrow': 'Need Right Now',
  'home.need.title': 'What do you need right now?',
  'home.need.body': "You're in the right place. We will guide you through the weekend.",
  'home.need.next.eyebrow': 'What is Next',
  'home.need.next.cta': 'Open Now & Next',
  'home.need.next.emptyTitle': 'Schedule posting soon',
  'home.need.next.emptyBody': 'Weekend timing will appear here once events are posted.',
  'home.need.directions.eyebrow': 'Get Me There',
  'home.need.directions.cta': 'Open Apple Maps',
  'home.need.directions.fallbackTitle': 'Fenway Hotel',
  'home.need.directions.fallbackBody': 'No event is live yet, so we will route you to Fenway Hotel.',
  'home.need.table.eyebrow': 'Where Do I Sit',
  'home.need.table.cta': 'Open Seating',
  'home.need.table.readyBody': 'Your seat is ready. Tap below for your assignment details.',
  'home.need.table.emptyTitle': 'Table not posted yet',
  'home.need.table.emptyBody': 'Check Seating for updates from Kara and Kevin.',

  'home.weather.eyebrow': 'Live Weather',
  'home.weather.title': 'Tampa Right Now',

  'home.uber.eyebrow': 'Ride Ready',
  'home.uber.title': 'Request an Uber',
  'home.uber.body':
    'One tap to open Uber with pickup at your location and destination set to Fenway Hotel.',
  'home.uber.button': 'Open Uber',

  'home.flight.eyebrow': 'Travel Hub',
  'home.flight.title': 'Flying in? Add your flight.',
  'home.flight.body': 'Share arrival details so your group can coordinate rides.',
  'home.flight.airportOne': 'Tampa (TPA)',
  'home.flight.airportTwo': 'St. Pete-Clearwater (PIE)',
  'home.flight.buttonPrimary': 'Track Flight',
  'home.flight.buttonSecondary': 'Airport Info',

  'home.feed.eyebrow': 'Live Moments',
  'home.feed.title': 'Wedding Feed: Photos + Notes',
  'home.feed.body': 'See shared memories and quick text updates from guests across the weekend.',
  'home.feed.empty': 'No feed photos yet. Upload one from Gallery to start the live reel.',
  'home.feed.postLabel': 'Share a quick update',
  'home.feed.postPlaceholder':
    'Example: We just arrived at cocktail hour and it looks incredible.',
  'home.feed.postButton': 'Post Update',
  'home.feed.noTextUpdates': 'No text updates yet. Be the first to post one.',
  'home.feed.preview.eyebrow': 'Recent Text Updates',
  'home.feed.preview.button': 'Open Feed & Gallery',
  'home.feed.preview.countPrefix': 'Showing latest',
  'home.feed.preview.emptyCount': 'No text updates yet',
  'home.feed.preview.composeShow': 'Share a quick update',
  'home.feed.preview.composeHide': 'Hide update composer',

  'home.quick.timeline.eyebrow': 'Now & Next',
  'home.quick.timeline.title': 'Wedding Timeline',
  'home.quick.timeline.body': 'See what is happening now and what is coming up next.',

  'home.quick.guide.eyebrow': 'Around Town',
  'home.quick.guide.title': 'Local Guide',
  'home.quick.guide.body': 'Curated Dunedin and Tampa recommendations for guests.',

  'home.quick.seating.eyebrow': 'Reception',
  'home.quick.seating.title': 'Seating',
  'home.quick.seating.body': 'Find your table assignment quickly.',

  'home.quick.songs.eyebrow': 'Dance Floor',
  'home.quick.songs.title': 'Song Requests',
  'home.quick.songs.body': 'Share a song for the DJ list.',

  'home.quick.gallery.eyebrow': 'Memories',
  'home.quick.gallery.title': 'Wedding Feed & Gallery',
  'home.quick.gallery.body': 'Post to the feed or browse every photo from the weekend.',
} as const

export type DashboardTextKey = keyof typeof DASHBOARD_TEXT_DEFAULTS
export type DashboardTextValues = Record<DashboardTextKey, string>

export type DashboardTextField = {
  key: DashboardTextKey
  label: string
  multiline?: boolean
}

export type DashboardTextSection = {
  title: string
  fields: DashboardTextField[]
}

export const DASHBOARD_TEXT_EDITOR_SECTIONS: DashboardTextSection[] = [
  {
    title: 'Header',
    fields: [
      { key: 'layout.eyebrow', label: 'Header eyebrow' },
      { key: 'layout.meta', label: 'Header date/location line' },
      { key: 'layout.title', label: 'Header title' },
      { key: 'layout.subtitle', label: 'Header subtitle' },
    ],
  },
  {
    title: 'Need Right Now',
    fields: [
      { key: 'home.need.eyebrow', label: 'Section eyebrow' },
      { key: 'home.need.title', label: 'Section title' },
      { key: 'home.need.body', label: 'Section description', multiline: true },
      { key: 'home.need.next.eyebrow', label: 'Next card eyebrow' },
      { key: 'home.need.next.cta', label: 'Next card button' },
      { key: 'home.need.next.emptyTitle', label: 'Next empty title' },
      { key: 'home.need.next.emptyBody', label: 'Next empty description', multiline: true },
      { key: 'home.need.directions.eyebrow', label: 'Directions card eyebrow' },
      { key: 'home.need.directions.cta', label: 'Directions button' },
      { key: 'home.need.directions.fallbackTitle', label: 'Directions fallback title' },
      { key: 'home.need.directions.fallbackBody', label: 'Directions fallback description', multiline: true },
      { key: 'home.need.table.eyebrow', label: 'Table card eyebrow' },
      { key: 'home.need.table.cta', label: 'Table button' },
      { key: 'home.need.table.readyBody', label: 'Table ready description', multiline: true },
      { key: 'home.need.table.emptyTitle', label: 'Table empty title' },
      { key: 'home.need.table.emptyBody', label: 'Table empty description', multiline: true },
    ],
  },
  {
    title: 'Weather + Uber + Flight Hub Card',
    fields: [
      { key: 'home.weather.eyebrow', label: 'Weather eyebrow' },
      { key: 'home.weather.title', label: 'Weather title' },
      { key: 'home.uber.eyebrow', label: 'Uber eyebrow' },
      { key: 'home.uber.title', label: 'Uber title' },
      { key: 'home.uber.body', label: 'Uber description', multiline: true },
      { key: 'home.uber.button', label: 'Uber button text' },
      { key: 'home.flight.eyebrow', label: 'Flight hub eyebrow' },
      { key: 'home.flight.title', label: 'Flight hub title', multiline: true },
      { key: 'home.flight.body', label: 'Flight hub description', multiline: true },
      { key: 'home.flight.airportOne', label: 'Airport line 1' },
      { key: 'home.flight.airportTwo', label: 'Airport line 2' },
      { key: 'home.flight.buttonPrimary', label: 'Flight primary button' },
      { key: 'home.flight.buttonSecondary', label: 'Flight secondary button' },
    ],
  },
  {
    title: 'Wedding Feed Card',
    fields: [
      { key: 'home.feed.eyebrow', label: 'Feed eyebrow' },
      { key: 'home.feed.title', label: 'Feed title' },
      { key: 'home.feed.body', label: 'Feed description', multiline: true },
      { key: 'home.feed.empty', label: 'Feed empty message', multiline: true },
      { key: 'home.feed.postLabel', label: 'Post field label' },
      { key: 'home.feed.postPlaceholder', label: 'Post field placeholder', multiline: true },
      { key: 'home.feed.postButton', label: 'Post button text' },
      { key: 'home.feed.noTextUpdates', label: 'No text updates message', multiline: true },
      { key: 'home.feed.preview.eyebrow', label: 'Preview eyebrow' },
      { key: 'home.feed.preview.button', label: 'Preview CTA button' },
      { key: 'home.feed.preview.countPrefix', label: 'Preview count prefix' },
      { key: 'home.feed.preview.emptyCount', label: 'Preview empty count label' },
      { key: 'home.feed.preview.composeShow', label: 'Composer show label' },
      { key: 'home.feed.preview.composeHide', label: 'Composer hide label' },
    ],
  },
  {
    title: 'Quick Link Cards',
    fields: [
      { key: 'home.quick.timeline.eyebrow', label: 'Timeline eyebrow' },
      { key: 'home.quick.timeline.title', label: 'Timeline title' },
      { key: 'home.quick.timeline.body', label: 'Timeline description', multiline: true },
      { key: 'home.quick.guide.eyebrow', label: 'Guide eyebrow' },
      { key: 'home.quick.guide.title', label: 'Guide title' },
      { key: 'home.quick.guide.body', label: 'Guide description', multiline: true },
      { key: 'home.quick.seating.eyebrow', label: 'Seating eyebrow' },
      { key: 'home.quick.seating.title', label: 'Seating title' },
      { key: 'home.quick.seating.body', label: 'Seating description', multiline: true },
      { key: 'home.quick.songs.eyebrow', label: 'Songs eyebrow' },
      { key: 'home.quick.songs.title', label: 'Songs title' },
      { key: 'home.quick.songs.body', label: 'Songs description', multiline: true },
      { key: 'home.quick.gallery.eyebrow', label: 'Gallery eyebrow' },
      { key: 'home.quick.gallery.title', label: 'Gallery title' },
      { key: 'home.quick.gallery.body', label: 'Gallery description', multiline: true },
    ],
  },
]

export function mergeDashboardText(overrides: Record<string, string> | undefined): DashboardTextValues {
  return {
    ...DASHBOARD_TEXT_DEFAULTS,
    ...(overrides ?? {}),
  }
}
