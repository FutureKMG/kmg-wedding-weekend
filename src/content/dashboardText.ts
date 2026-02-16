export const DASHBOARD_TEXT_DEFAULTS = {
  'layout.eyebrow': 'The Gilmore Wedding Weekend',
  'layout.meta': 'March 13-15 · Tampa, Florida',
  'layout.title': 'Welcome, {GuestFirstName}.',
  'layout.subtitle': 'Your personal concierge for the weekend.',

  'home.hero.title': 'Your personal concierge for the weekend.',
  'home.hero.body':
    'Everything you need - from timelines to table numbers - all in one place.',
  'home.hero.note': 'March 13-15, 2026 · Tampa, Florida',

  'home.weather.eyebrow': 'Live Weather',
  'home.weather.title': 'Tampa Right Now',

  'home.uber.eyebrow': 'Ride Ready',
  'home.uber.title': 'Request an Uber',
  'home.uber.body':
    'One tap to open Uber with pickup at your location and destination set to Fenway Hotel.',
  'home.uber.button': 'Open Uber',

  'home.flight.eyebrow': 'Travel Hub',
  'home.flight.title':
    'Flying in for the weekend? Add your flight details to keep everything in one place.',
  'home.flight.body':
    'Track arrival times, coordinate rides, and make sure you do not miss a moment of the celebration.',
  'home.flight.airportOne': 'Tampa International (TPA)',
  'home.flight.airportTwo': 'St. Pete-Clearwater (PIE)',
  'home.flight.buttonPrimary': 'Track Your Flight',
  'home.flight.buttonSecondary': 'View Airport Info',

  'home.feed.eyebrow': 'Live Moments',
  'home.feed.title': 'Wedding Feed: Photos + Notes',
  'home.feed.body': 'See shared memories and quick text updates from guests across the weekend.',
  'home.feed.empty': 'No feed photos yet. Upload one from Gallery to start the live reel.',
  'home.feed.postLabel': 'Share a quick update',
  'home.feed.postPlaceholder':
    'Example: We just arrived at cocktail hour and it looks incredible.',
  'home.feed.postButton': 'Post Update',
  'home.feed.noTextUpdates': 'No text updates yet. Be the first to post one.',

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
    title: 'Hero Card',
    fields: [
      { key: 'home.hero.title', label: 'Hero title' },
      { key: 'home.hero.body', label: 'Hero description', multiline: true },
      { key: 'home.hero.note', label: 'Hero note', multiline: true },
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
