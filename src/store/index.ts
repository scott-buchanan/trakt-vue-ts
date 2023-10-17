import { defineStore } from 'pinia'
import type { Filter, MyInfo, PageData, StateObj } from './models'
import type Trakt from '~/api/trakt.types'

const defaultState: StateObj = {
  page: 1,
  filter: { label: null, val: null, auth: null } as Filter,
  filterOptions: {
    show: [
      { label: 'Trending', val: 'trending', auth: false } as Filter,
      { label: 'Watch History', val: 'history', auth: true } as Filter,
      { label: 'Anticipated', val: 'anticipated', auth: false } as Filter,
      { label: 'My Recommended', val: 'recommended', auth: true } as Filter,
      { label: 'Community Recommended', val: 'trakt_recommended', auth: false } as Filter,
    ],
    movie: [
      { label: 'Trending', val: 'trending', auth: false } as Filter,
      { label: 'Watch History', val: 'history', auth: true } as Filter,
      { label: 'My Recommended', val: 'recommended', auth: true } as Filter,
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
  genres: null,
  imageUrls: null,
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
    updateMyInfo(myInfo: MyInfo) {
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
    updateGenres(value: { tv: { id: number; name: string }[]; movie: { id: number; name: string }[] }) {
      this.genres = value
    },
    updateImageUrls(value: any[]) {
      this.imageUrls = value
    },
    updateSearchPage(value: any) {
      this.searchPage = value
    },
    reset() {
      Object.assign(this, defaultState)
    },
  },
})
