import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { useStore } from '~/store/index'
import {
  getMyEpisodeRatings,
  getMyLikes,
  getMyMovieRatings,
  getMySeasonRatings,
  getMyShowRatings,
  getTraktSettings,
  // getMyWatchedMovies,
} from '~/api/trakt'
import { getGenres, getImageUrls } from '~/api/tmdb'
import type Trakt from '~/api/trakt.types'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const store = useStore()

  // Update myInfo if logged in
  const authTokens: Trakt.AuthTokens = JSON.parse(localStorage.getItem('trakt-vue-token') || '{}') as Trakt.AuthTokens

  if (authTokens.access_token) {
    const myInfo: Trakt.MyInfo = await getTraktSettings()

    store.updateTokens(authTokens)
    store.updateMyInfo(myInfo)
  }

  // get tmdbConfig and store in state
  if (!store.tmdbConfig)
    store.updateTmdbConfig(await getImageUrls())

  // get tmdb genres and store in state
  if (store.genres.tv.length === 0 || store.genres.movie.length === 0)
    store.updateGenres(await getGenres())

  if (authTokens.access_token) {
    // if local storage has tokens, get the accessToken from the refreshToken

    let myShowRatings: Trakt.Ratings
    let mySeasonRatings: Trakt.Ratings
    let myEpRatings: Trakt.Ratings
    let myMovieRatings: Trakt.Ratings
    let myLikes: Trakt.Like[] = []
    // let myWatchedMovies: Trakt.WatchedMovie[] = []

    if (to.path.split('/')[1] === 'movies') {
      // [myMovieRatings, myLikes, myWatchedMovies] = await Promise.all([
      //   getMyMovieRatings(true),
      //   getMyLikes(1),
      //   getMyWatchedMovies(),
      // ])
      [myMovieRatings, myLikes] = await Promise.all([
        getMyMovieRatings(true),
        getMyLikes(1),
      ])

      store.updateRatings('movie', myMovieRatings)
    }
    else {
      // tv section route
      [myShowRatings, mySeasonRatings, myEpRatings, myLikes]
        = await Promise.all([
          getMyShowRatings(true),
          getMySeasonRatings(true),
          getMyEpisodeRatings(true),
          getMyLikes(1),
        ])

      for (const ratings of [myShowRatings, mySeasonRatings, myEpRatings]) {
        // get localStorage ratings
        const localStorageRatings: Trakt.Ratings = JSON.parse(localStorage.getItem(
          `trakt-vue-${ratings.type}-ratings`,
        ) || '{}') as Trakt.Ratings

        // if no localStorage or if API return modified date doesn't match localStorage modified date
        if (
          !localStorageRatings
          || ratings.lastModified !== localStorageRatings.lastModified
        ) {
          switch (ratings.type) {
            case 'show':
              myShowRatings = await getMyShowRatings()
              localStorage.setItem(
                `trakt-vue-${ratings.type}-ratings`,
                JSON.stringify(myShowRatings),
              )
              break
            case 'season':
              mySeasonRatings = await getMySeasonRatings()
              localStorage.setItem(
                `trakt-vue-${ratings.type}-ratings`,
                JSON.stringify(mySeasonRatings),
              )
              break
            case 'episode':
              myEpRatings = await getMyEpisodeRatings()
              localStorage.setItem(
                `trakt-vue-${ratings.type}-ratings`,
                JSON.stringify(myEpRatings),
              )
          }
        }
      }

      // update the store with new ratings
      store.updateRatings('show', myShowRatings)
      store.updateRatings('season', mySeasonRatings)
      store.updateRatings('episode', myEpRatings)
    }

    const storedLikes: Trakt.Like[]
      = JSON.parse(localStorage.getItem('trakt-vue-likes') || '{}') as Trakt.Like[]
    // set to localStorage here to eliminate delay
    localStorage.setItem('trakt-vue-likes', JSON.stringify(myLikes))
    // need to add this check because this call needs token
    if (storedLikes && storedLikes[0] !== myLikes[0]) {
      if (storedLikes.length > 99) {
        const remainingLikes = await getMyLikes()
        const total = { ...myLikes, ...remainingLikes }
        localStorage.setItem('trakt-vue-likes', JSON.stringify(total))
      }
      else {
        localStorage.setItem('trakt-vue-likes', JSON.stringify(myLikes))
      }
    }
  }

  if (to.query.page)
    store.updatePage(to.query.page as string)

  next()
})

export default router
