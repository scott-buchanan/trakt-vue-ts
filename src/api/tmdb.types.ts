import type Trakt from './trakt.types'

namespace Tmdb {
  export interface Actor {
    id: number
    ids: Trakt.Ids
    name: string
    character: string
    order: number
    profile_path: string
  }
  export interface EpisodeDetails {
    id: number
    air_date: string
    episode_number: number
    name: string
    overview: string
    season_number: number
    still_path: string
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
    poster_path: string
    seasons: Season[]
    spoken_languages: SpokenLanguage[]
    origin_country: String[]
    status: string
    tagline: string
    episode_run_time: number[]
  }

  export interface MovieDetails {
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
    videos:
  }

  export interface SeasonDetails {
    id: number
    air_date: string
    episodes: EpisodeDetails[]
    name: string
    overview: string
    poster_path: string
    season_number: number
  }

  export interface Season {
    air_data: string
    episode_count: number
    id: number
    name: string
    overview: string
    poster_path: string
    season_number: number
    watched_percent: string
    watched_progress: number
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
  }

  export interface Video {
    iso_639_1: string
    key: string
    type: string
  }
}
export default Tmdb
