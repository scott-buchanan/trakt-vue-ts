import type Trakt from '~/api/trakt.types'
import type Tmdb from '~/api/tmdb.types'

export interface Filter {
  label: string
  val: string
  auth: boolean
}

export interface FilterOptions {
  show: Filter[]
  movie: Filter[]
}

export type FilterType = 'show' | 'movie'

export interface StateObj {
  page: string
  filter: Filter
  filterOptions: FilterOptions
  filterType: FilterType
  loaded: boolean
  tokens: Trakt.AuthTokens | null
  myInfo: Trakt.MyInfo | null
  menuVisible: boolean
  currentIds: Trakt.Ids | null
  genres: Tmdb.Genres
  ratings: {
    episode: Trakt.Ratings
    season: Trakt.Ratings
    show: Trakt.Ratings
    movie: Trakt.Ratings
  }
  tmdbConfig: Tmdb.TmdbConfig | null
  searchPage: number | null
  backgroundInfo: any | null
}
