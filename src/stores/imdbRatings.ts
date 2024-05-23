import { defineStore } from 'pinia'

interface RatingsState {
  ratings: {
    [key: string]: {
      timestamp: Date
      rating: number
    }
  }
}

const state: RatingsState = { ratings: {} }

export const useStore = defineStore('imdbRatings', {
  state: () => ({ ...state }),
  getters: {
    getRatingById: (state: RatingsState) => {
      return (id: string) => state.ratings[id]
    },
  },
  actions: {
    addRating(id: string, rating: number) {
      console.log('inside add rating', id, rating, this.state)
      this.state.ratings[id] = {
        timestamp: new Date(),
        rating,
      }
      console.log(this.state)
    },
  },
  // persist: {
  //   storage: sessionStorage,
  // },
})
