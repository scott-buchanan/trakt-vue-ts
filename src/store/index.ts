import { defineStore } from 'pinia'
import type { Filter, MyInfo, StateObj } from './models'
import type Trakt from '~/api/trakt.types'

export const useStore = defineStore('main', {
  state: (): StateObj => ({
    page: 1,
    filter: { label: null, val: null, auth: null } as Filter,
    filterOptions: {
      show: [
        { label: 'Trending', val: 'trending', auth: false } as Filter,
        { label: 'Watch History', val: 'history', auth: true } as Filter,
        { label: 'My Recommended', val: 'recommended', auth: true } as Filter,
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
  }),
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
  },
})
