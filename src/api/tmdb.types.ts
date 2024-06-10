import type Trakt from './trakt.types'

namespace Tmdb {
  export interface TmdbConfig {
    images: {
      base_url: string
      secure_base_url: string
      backdrop_sizes: string[]
      logo_sizes: string[]
      poster_sizes: string[]
      profile_sizes: string[]
      still_sizes: string[]
    }
    change_keys: string[]
  }
  export interface Actor {
    id: number
    ids: Trakt.Ids
    name: string
    character: string
    popularity: number
    profile_path: string | null
  }
  export interface Video {
    key: string
  }
  export interface EpisodeDetails {
    id: number
    air_date: string
    episode_number: number
    first_air_date: string
    name: string
    overview: string
    season_number: number
    status: string
    still_path: string
    videos: Video[]
    vote_average: number
    vote_count: number
  }
  export interface ShowDetails {
    backdrop_path: string
    first_air_date: string
    genres: Genre[]
    languages: string[]
    number_of_episodes: number
    number_of_seasons: number
    poster_path: string | null
    seasons: Season[]
    spoken_languages: SpokenLanguage[]
    origin_country: string[]
    status: string
    tagline: string
    episode_run_time: number[]
    videos: Video[] | null
    season: number
    vote_average: number
  }

  export interface MovieDetails {
    id: number
    backdrop_path: string
    belongs_to_collection: Collection
    budget: number
    first_air_date: string
    genres: Genre[]
    production_companies: ProductionCompany[]
    number_of_episodes: number
    number_of_seasons: number
    poster_path: string
    release_date: string
    spoken_languages: SpokenLanguage[]
    production_countries: string[]
    overview: string
    status: string
    tagline: string
    runtime: number
    revenue: number
    videos: Video[] | null
    vote_average: number
  }

  export interface SeasonDetails {
    id: number
    air_date: string
    episodes: EpisodeDetails[]
    first_air_date: string
    name: string
    overview: string
    poster_path: string
    season_number: number
    season: number
    status: string
    videos: Video[]
  }

  export interface Season {
    air_data: string
    episode_count: number
    id: number
    name: string
    overview: string
    poster_path: string | null
    season_number: number
    watched_percent: string
    watched_progress: number
  }

  export interface Genres {
    movie: Tmdb.Genre[]
    tv: Tmdb.Genre[]
  }

  export interface Genre {
    id: number
    name: string
  }

  export interface SpokenLanguage {
    english_name: string
    iso_639_1: string
    name: string
  }

  export interface ProductionCompany {
    name: string
  }

  export interface Collection {
    id: number
    name: string
    poster_path: string
    backdrop_path: string
    overview: string
    poster_path: string
    parts: {
      title: string
      poster_path: string
      id: number
      watched_progress: Trakt.WatchedProgress
      slug: string
      release_date: string
    }[]
  }

  export interface Video {
    iso_639_1: string
    key: string
    type: string
  }

  export interface BackgroundInfo {
    ids: Trakt.Ids
    title: string
    backgroundUrl: string
    type: string
    year: string
    posterUrl: string
  }
}
export default Tmdb
