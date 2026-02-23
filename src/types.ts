export type GuestProfile = {
  id: string
  firstName: string
  lastName: string
  tableLabel: string | null
  canUpload: boolean
  canEditContent: boolean
  canAccessGirlsRoom: boolean
  accountType: 'guest' | 'vendor'
  vendorName: string | null
  canAccessVendorForum: boolean
  rsvpReception: string | null
  canAccessPhilliesWelcome: boolean
}

export type WeddingEvent = {
  id: string
  title: string
  location: string
  startAt: string
  endAt: string
  sortOrder: number
}

export type GuideItem = {
  id: string
  title: string
  category: string
  description: string
  address: string | null
  mapsUrl: string | null
  sortOrder: number
}

export type SongRequestPayload = {
  songTitle: string
  artist?: string
  note?: string
}

export type PhotoItem = {
  id: string
  imageUrl: string
  caption: string | null
  uploadedBy: string
  createdAt: string
  isFeedPost: boolean
  isOwner: boolean
}

export type FeedUpdate = {
  id: string
  message: string
  createdAt: string
  postedBy: string
  isOwner: boolean
}

export type GirlsRoomReply = {
  id: string
  threadId: string
  message: string
  createdAt: string
  postedBy: string
  isOwner: boolean
}

export type GirlsRoomThread = {
  id: string
  item: string
  message: string
  createdAt: string
  postedBy: string
  isOwner: boolean
  replies: GirlsRoomReply[]
}

export type VendorForumReply = {
  id: string
  threadId: string
  message: string
  createdAt: string
  postedBy: string
  isOwner: boolean
}

export type VendorForumThread = {
  id: string
  item: string
  message: string
  createdAt: string
  postedBy: string
  isOwner: boolean
  replies: VendorForumReply[]
}

export type FlightDetail = {
  arrivalAirport: 'TPA' | 'PIE'
  arrivalTime: string
  airline: string | null
  flightNumber: string | null
  notes: string | null
  updatedAt: string
}

export type FlightPartyMember = {
  guestId: string
  firstName: string
  lastName: string
  arrivalAirport: 'TPA' | 'PIE'
  arrivalTime: string
  airline: string | null
  flightNumber: string | null
  notes: string | null
  updatedAt: string
}

export type SeatingInfo = {
  tableLabel: string | null
  mealSelection: string | null
  dietaryRestrictions: string | null
}

export type MorningServiceType = 'hair' | 'makeup' | 'bride_hair' | 'bride_makeup' | 'junior_hair'

export type MorningScheduleAssignment = {
  id: string
  serviceType: MorningServiceType
  serviceLabel: string
  artistName: string
  startAt: string
  location: string
  notes: string | null
}

export type MorningSchedulePayload = {
  location: string
  timezone: string
  weddingDate: string
  finishTime: string
  photoReadyTime: string
  arrivalLeadMinutes: number
  assignments: MorningScheduleAssignment[]
  migrationRequired?: boolean
}
