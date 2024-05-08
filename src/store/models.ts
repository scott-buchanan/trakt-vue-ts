import type Trakt from '~/api/trakt.types'
import type { EpisodeDetails, MovieDetails, SeasonDetails, ShowDetails } from '~/api/combinedCall.types'
import Tmdb from '~/api/tmdb.types';

export interface Filter {
  label: string | null
  val: string | null
  auth: boolean | null
}

export interface PageData {
  episodes: EpisodeDetails[]
  shows: ShowDetails[]
  seasons: SeasonDetails[]
  movies: MovieDetails[]
}

export interface StateObj {
  page: number
  filter: Filter
  filterOptions: {
    show: Filter[],
    movie: Filter[]
  }
  filterType: string | null
  loaded: boolean
  tokens: object | null
  myInfo: Trakt.MyInfo | null
  menuVisible: boolean
  currentIds: Trakt.Ids | null
  genres: Tmdb.Genres
  tmdbConfig: Tmdb.TmdbConfig | null
  pageData: PageData
  searchPage: number | null
}

