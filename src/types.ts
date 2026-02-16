export type GuestProfile = {
  id: string
  firstName: string
  tableLabel: string | null
  canUpload: boolean
  canEditContent: boolean
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
