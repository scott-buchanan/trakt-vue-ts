import type Trakt from '~/api/trakt.types'

export interface Filter {
  label: string | null
  val: string | null
  auth: boolean | null
}

export interface StateObj {
  page: number
  filter: Filter
  filterOptions: { show: Array<Filter>; movie: Array<Filter> }
  filterType: string | null
  loaded: boolean
  tokens: object | null
  myInfo: Trakt.MyInfo | null
  menuVisible: boolean
  currentIds: Trakt.Ids | null
}
