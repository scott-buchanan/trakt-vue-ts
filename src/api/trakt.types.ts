import type { MediaType } from '~/types/types'

export namespace Trakt {
  // settings
  export interface MyInfo {
    account: {
      cover_image: string
    }
    user: User
  }

  export interface User {
    name: string
    username: string
    images: {
      avatar: {
        full: string
      }
    }
  }

  export interface Ids {
    trakt: number
    slug: string
    tmdb: number
    imdb: string
    tvdb: number
  }

  export interface AuthTokens {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token: string
    scope: string
    created_at: number
  }

  export interface Like {
    liked_at: string
    comment: { id: number }
    type: string
  }

  export interface Rating {
    rated_at: string
    rating: number
    type: MediaType
    show: Show
    episode?: Episode
    season?: Season
  }

  export interface Comment {
    created_at: string
    comment: string
    spoiler: boolean
    review: boolean
    replies: number
    likes: number
    user_stats: {
      rating: number
    }
    user: {
      username: string
      name: string
      ids: {
        slug: string
      }
    }
  }

  export interface Ratings {
    total: number
    lastModified: string
    ratings: Rating[]
  }

  export interface Episode {
    ids: Ids
    title: string
    season: string
    number: number
    year?: number
  }

  export interface Season {
    ids: Ids
    number: number
  }

  export interface Show {
    ids: Ids
    title: string
    year: number
  }

  export interface Movie {
    ids: Ids
    title: string
    year: number
  }

  export interface WatchedProgress {
    aired?: number
    completed?: number
    last_watched_at: string
    seasons?: {
      aired: number
      completed: number
      episodes: {
        completed: boolean
        last_watched_at: string
        number: number
      }[]
      number: number
    }[]
    type: MediaType
  }
}

export default Trakt
