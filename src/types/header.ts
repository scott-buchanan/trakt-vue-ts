export interface autocompleteResult {
  ids: {
    slug: string
  }
  label: string
  value: string
  type: string
  thumbnail: string
  year: string
  genres: Array<string>
  episode?: {
    season: string
    number: string
  }
}
