import { defineStore } from 'pinia'
import type { Filter, StateObj, PageData } from './models'
import type Trakt from '~/api/trakt.types'
import Tmdb from '~/api/tmdb.types'

const defaultState: StateObj = {
  page: 1,
  filter: { label: null, val: null, auth: null },
  filterOptions: {
    show: [
      { label: 'Trending', val: 'trending', auth: false },
      { label: 'Watch History', val: 'history', auth: true },
      { label: 'Anticipated', val: 'anticipated', auth: false },
      { label: 'My Recommended', val: 'recommended', auth: true },
      { label: 'Community Recommended', val: 'trakt_recommended', auth: false },
    ],
    movie: [
      { label: 'Trending', val: 'trending', auth: false },
      { label: 'Watch History', val: 'history', auth: true } ,
      { label: 'My Recommended', val: 'recommended', auth: true },
    ],
  },
  filterType: null,
  loaded: false,
  tokens: null,
  myInfo: null,
  menuVisible: false,
  currentIds: null,
  pageData: {
    episodes: {},
    shows: {},
    seasons: {},
    movies: {},
  },
  genres: {
    movie: [],
    tv: []
  },
  tmdbConfig: null,
  searchPage: null,
}

export const useStore = defineStore('main', {
  state: () => ({ ...defaultState }),
  actions: {
    updatePage(page: number) {
      this.page = page
    },
    updateFilter(filter: Filter) {
      this.filter = filter
    },
    updateFilterType(type: string) {
      this.filterType = type
    },
    updateLoading(loaded: boolean) {
      this.loaded = loaded
    },
    updateTokens(tokens: object) {
      this.tokens = { ...tokens }
    },
    updateMyInfo(myInfo: Trakt.MyInfo) {
      this.myInfo = { ...myInfo }
    },
    updateMenuVisible(value: boolean) {
      this.menuVisible = value
    },
    updateCurrentIds(value: Trakt.Ids) {
      this.currentIds = value
    },
    updatePageData(value: PageData, mType: string) {
      switch (mType) {
        case 'episode':
          this.pageData.episodes = { ...this.pageData.episodes, ...value }
          break
      }
    },
    updateGenres(value: Tmdb.Genres) {
      this.genres = value
    },
    updateTmdbConfig(value: Tmdb.TmdbConfig) {
      this.tmdbConfig = value
    },
    updateSearchPage(value: any) {
      this.searchPage = value
    },
    reset() {
      Object.assign(this, defaultState)
    },
  },
})
