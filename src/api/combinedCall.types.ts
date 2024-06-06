import type Trakt from './trakt.types'
import type Tmdb from './tmdb.types'
import type { MediaType } from '~/types/types'

export interface Backdrop {
  backdrop_sm: string
  backdrop_lg: string
}

export interface EpisodeCardInfo {
  show: Trakt.Show
  episode: Trakt.Episode
  // title: string
  backdrop: Backdrop | null
  imdb_rating: number | null
  trakt_rating: number | null
  tmdb_rating: number | null
  // my_rating: Trakt.Rating
  clear_logo: string | null
  watched_at?: string
  // watchers: string
  // genres: Tmdb.Genre[]
  // list_count: number
  // user_count: number
  // imgLoaded: boolean
  // clearImgLoaded: boolean
  // movie: Trakt.Movie
  // rank: number
}

export interface ShowCardInfo {
  show: Trakt.Show
  backdrop: Backdrop | null
  imdb_rating: number | null
  trakt_rating: number | null
  tmdb_rating: number | null
  clear_logo: string | null
  genres: Tmdb.Genre[] | null
}

export interface MovieCardInfo {
  movie: Trakt.Movie
  backdrop: Backdrop | null
  imdb_rating: number | null
  trakt_rating: number | null
  tmdb_rating: number | null
  clear_logo: string | null
}

export interface ShowDetails {
  actors: Tmdb.Actor[]
  aired_episodes: number
  airs: { day: string, time: string, timezone: string }
  backdrop: Backdrop
  certification: string
  clear_logo: string
  country: string
  first_aired: string
  ids: Trakt.Ids
  imdb_rating: string
  language: string
  my_rating: number
  network: string
  overview: string
  reviews: Trakt.Comments
  runtime: number
  show: Trakt.Show
  show_poster: string
  title: string
  tmdb_data: Tmdb.ShowDetails
  tmdb_rating: string
  trailer: string
  trakt_rating: string
  type: MediaType
  watched_progress: Trakt.WatchedProgress
  year: string
  season: number
}

export interface MovieDetails {
  actors: Tmdb.Actor[]
  backdrop: Backdrop
  certification: string
  clear_logo: string
  country: string
  released: string
  ids: Trakt.Ids
  imdb_rating: string
  language: string
  my_rating: number
  network: string
  overview: string
  reviews: Trakt.Comments
  runtime: number
  show: Trakt.Show
  show_poster: string
  title: string
  tagline: string
  tmdb_data: Tmdb.MovieDetails
  tmdb_rating: string
  trailer: string
  trakt_rating: string
  type: MediaType
  watched_progress?: Trakt.WatchedMovie
  year: string
  poster: string
  season: number
}

export interface EpisodeDetails {
  title: string
  season: number
  number: number
  runtime: number
  first_aired: string
  backdrop: Backdrop
  season_poster: string
  clear_logo: string
  imdb_rating: number
  trakt_rating: number
  reviews: Trakt.Comments
  actors: Tmdb.Actor[]
  tmdb_data: Tmdb.EpisodeDetails
  tmdb_rating: number
  my_rating: number
  show: Trakt.Show
  type: MediaType
  watched_progress: Trakt.WatchedProgress | null
}

export interface SeasonDetails {
  title: string
  number: number
  runtime: number
  first_aired: string
  backdrop: Backdrop
  season_poster: string
  season: number
  clear_logo: string
  imdb_rating: number
  trakt_rating: number
  my_rating: number
  reviews: Trakt.Comments
  actors: Tmdb.Actor[]
  tmdb_data: Tmdb.SeasonDetails
  tmdb_rating: number
  type: string
  show: Trakt.Show
  network: string
  watched_progress: Trakt.WatchedProgress
}
