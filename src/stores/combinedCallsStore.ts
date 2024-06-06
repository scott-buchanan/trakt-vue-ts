import { defineStore } from 'pinia'
import type { EpisodeCardInfo, MovieCardInfo, ShowCardInfo } from '~/api/combinedCall.types'

interface StateObj {
  episodeInfoCards: EpisodeCardInfo[]
  showInfoCards: ShowCardInfo[]
  movieInfoCards: MovieCardInfo[]
}

export const useCombinedCallsStore = defineStore('combinedCallsStore', {
  state: (): StateObj => ({
    episodeInfoCards: [],
    showInfoCards: [],
    movieInfoCards: [],
  }),
  persist: false,
  actions: {
    getEpisodeInfoCard(slug: string, season: number, episode: number): EpisodeCardInfo | null {
      return this.episodeInfoCards.find(item => item.show.ids?.slug === slug && item.episode?.season === season && item.episode?.number === episode) || null
    },
    getShowInfoCard(slug: string): ShowCardInfo | null {
      return this.showInfoCards.find(item => item.show.ids?.slug === slug) || null
    },
    getMovieInfoCard(slug: string): MovieCardInfo | null {
      return this.movieInfoCards.find(item => item.movie.ids?.slug === slug) || null
    },
    updateEpisodeInfoCards(info: EpisodeCardInfo) {
      this.episodeInfoCards = [...this.episodeInfoCards, ...[info]]
    },
    updateShowInfoCards(info: ShowCardInfo) {
      this.showInfoCards = [...this.showInfoCards, ...[info]]
    },
    updateMovieInfoCards(info: MovieCardInfo) {
      this.movieInfoCards = [...this.movieInfoCards, ...[info]]
    },
  },
})
