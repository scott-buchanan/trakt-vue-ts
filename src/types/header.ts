export interface autocompleteResult {
  ids: {
    slug: string
    imdb: string
    tmdb: string
  }
  label: string
  value: string
  media_type: string
  type: string
  thumbnail: string
  year: string
  genres: string[]
  known_for: {
    original_title: string
    original_name: string
  }[]
  episode?: {
    season: string
    number: string
  }
}
