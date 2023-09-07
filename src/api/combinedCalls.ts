import getImdbRating from '~/api/omdb'
import {
  getEpisodeBackdrop,
  getMovieBackdrop,
  getMoviePoster,
  getSeasonPoster,
  getShowBackdrop,
  getShowPoster,
  tmdbActors,
  tmdbEpisodeActors,
  tmdbEpisodeDetails,
  getMovieCollection as tmdbMovieCollection,
  tmdbMovieDetails,
  tmdbShowDetails,
  tmdbShowSeasonDetails,
} from '~/api/tmdb'
import { getMovieClearLogo, getShowClearLogo } from '~/api/fanart'
import {
  getComments,
  getEpisodeRating,
  getEpisodeSummary,
  getIdLookupTmdb,
  getIdLookupTrakt,
  getMovieRating,
  getMovieSummary,
  getSeasonSummary,
  getShowRating,
  getShowSummary,
  getShowWatchedProgress,
} from '~/api/trakt'
import type Trakt from '~/api/trakt.types'
import { MediaType } from '~/types/types'
import type { CardInfo, EpisodeDetails, SeasonDetails, ShowDetails } from '~/api/combinedCall.types'

import { useStore } from '~/store/index'

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {Object} show - trakt show object.
 * @param {Object} episode - trakt episode object
 * @returns {Object} Object containing images, ratings needed.
 */
export async function getEpisodeInfoCard(show: Trakt.Show, episode: Trakt.Episode) {
  const res = {} as CardInfo
  await Promise.all([
    getEpisodeBackdrop(show, episode),
    getShowClearLogo(show.ids.tvdb),
    getImdbRating(episode.ids.imdb),
    getEpisodeRating(show.ids.trakt, episode.season, episode.number),
    tmdbEpisodeDetails(show, episode),
  ]).then((results) => {
    [res.backdrop, res.clear_logo, res.imdb_rating, res.trakt_rating] = results
    res.tmdb_rating = results[4]?.vote_average.toFixed(1)
    res.type = MediaType.episode
  })
  return res
}

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {Object} show - trakt show object.
 * @returns {Object} Object containing images, ratings needed.
 */
export async function getShowInfoCard(show: Trakt.Show) {
  const res = {} as CardInfo
  await Promise.all([
    getShowBackdrop(show),
    getShowClearLogo(show.ids.tvdb),
    getImdbRating(show.ids.imdb),
    getShowRating(show.ids.trakt),
    tmdbShowDetails(show),
  ]).then((results) => {
    [res.backdrop, res.clear_logo, res.imdb_rating, res.trakt_rating] = results
    res.tmdb_rating = results[4]?.vote_average.toFixed(1)
    res.genres = results[4]?.genres
    res.type = MediaType.show
  })
  return res
}

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {Object} show - trakt show object.
 * @returns {Object} Object containing images, ratings needed.
 */
export async function getMovieInfoCard(movie: Trakt.Movie) {
  const res = {} as CardInfo
  await Promise.all([
    getMovieBackdrop(movie),
    getMovieClearLogo(movie.ids.tmdb),
    getImdbRating(movie.ids.imdb),
    getMovieRating(movie.ids.trakt),
    tmdbMovieDetails(movie),
  ]).then((results) => {
    [res.backdrop, res.clear_logo, res.imdb_rating, res.trakt_rating] = results
    res.tmdb_rating = results[4]?.vote_average.toFixed(1)
    res.genres = results[4]?.genres
    res.type = MediaType.movie
  })
  return res
}

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {string} slug - trakt show slug.
 * @param {number} season - season number
 * @param {number} number - episode number
 * @returns {Object} Object containing images, ratings needed.
 */
export async function getEpisodeDetails(traktId: number | string, season: string, episode: string) {
  const res: EpisodeDetails = {} as EpisodeDetails
  const summary = await getEpisodeSummary(traktId, season, episode)
  const store = useStore()

  if (store.pageData.episodes[summary.ids.trakt])
    return store.pageData.episodes[summary.ids.trakt]

  const { show } = await getIdLookupTrakt(summary.ids.trakt)
  summary.type = MediaType.episode
  summary.slug = show.ids.slug

  await Promise.all([
    getEpisodeBackdrop(show, summary),
    getSeasonPoster(show, summary.season),
    getShowClearLogo(show.ids.tvdb),
    getImdbRating(summary.ids.imdb),
    getEpisodeRating(show.ids.trakt, summary.season, summary.number),
    getComments(summary, 'episode'),
    tmdbEpisodeActors(show, summary),
    tmdbEpisodeDetails(show, summary),
    getShowWatchedProgress(show.ids.trakt),
  ]).then((results) => {
    [
      res.backdrop,
      res.season_poster,
      res.clear_logo,
      res.imdb_rating,
      res.trakt_rating,
      res.reviews,
      res.actors,
      res.tmdb_data,
    ] = results
    res.tmdb_rating = results[7]?.vote_average.toFixed(1)

    const watchedProgress = results[8]
    let watched
    // add to episode watched array
    if (watchedProgress?.completed > 0) {
      watched = localStorage.getItem('trakt-vue-watched-episodes')
        ? JSON.parse(localStorage.getItem('trakt-vue-watched-episodes')!)
        : []
      if (watched[show.ids.slug])
        watched[show.ids.slug] = watchedProgress
      else
        watched.push({ [show.ids.slug]: watchedProgress })

      localStorage.setItem('trakt-vue-watched-episodes', JSON.stringify(watched))
    }

    const haveWatched: Trakt.WatchedProgress = watched?.find((item: Trakt.WatchedProgress) => Object.keys(item)[0] === show.ids.slug)
    if (haveWatched) {
      res.watched_progress = {
        last_watched_at:
          Object.values(haveWatched)[0].seasons[season - 1].episodes[episode - 1].last_watched_at,
        type: MediaType.episode,
      }
    }
  })

  if (localStorage.getItem('trakt-vue-user')) {
    // get my rating from ratings in local storage
    const { ratings }: { ratings: Trakt.Rating[] } = JSON.parse(localStorage.getItem('trakt-vue-episode-ratings')!)
    const myRating = ratings.find(
      rating => rating.episode?.ids.trakt === summary.ids.trakt,
    )?.rating
    if (myRating)
      res.my_rating = myRating
  }

  console.log({ [summary.ids.trakt]: { ...{ show }, ...summary, ...res } })
  store.updatePageData({ [summary.ids.trakt]: { ...{ show }, ...summary, ...res } }, 'episode')
  return { ...{ show }, ...summary, ...res }
}

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {Object} show - trakt show object.
 * @returns {Object} Object containing images, ratings needed.
 */
export async function getSeasonDetails(slug: string, season: number): Promise<SeasonDetails> {
  const res: SeasonDetails = {} as SeasonDetails
  const show: Trakt.Show = await getShowSummary(slug)
  const seasonInfo = await getSeasonSummary(slug, season);

  [res.backdrop, res.clear_logo, res.tmdb_data, res.reviews] = await Promise.all([
    getShowBackdrop(show),
    getShowClearLogo(show.ids.tvdb),
    tmdbShowSeasonDetails(show, season),
    getComments(show),
  ])

  res.trakt_rating = seasonInfo.rating.toFixed(1)

  if (!res.tmdb_data.poster_path)
    res.tmdb_data.poster_path = await getShowPoster(show)
  else
    res.tmdb_data.poster_path = `https://image.tmdb.org/t/p/w780${res.tmdb_data.poster_path}`

  if (localStorage.getItem('trakt-vue-user')) {
    // get my rating from ratings in local storage
    const { ratings } = JSON.parse(localStorage.getItem('trakt-vue-season-ratings')!)
    res.my_rating = ratings.find(
      (rating: Trakt.Rating) => rating.season?.ids.trakt === seasonInfo.ids.trakt,
    )?.rating
  }

  return { ...res, ...seasonInfo, ...{ show } }
}

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {Object} show - trakt show object.
 * @returns {Object} Object containing images, ratings needed.
 */
export async function getShowDetails(traktId: number | string): Promise<ShowDetails> {
  const summary: Trakt.Show = await getShowSummary(traktId)
  const res: any = { ...summary }

  await Promise.all([
    getShowBackdrop(summary),
    getShowPoster(summary),
    getShowClearLogo(summary.ids.tvdb),
    getImdbRating(summary.ids.imdb),
    getShowRating(summary.ids.trakt),
    tmdbShowDetails(summary),
    getComments(summary, 'show'),
    tmdbActors(summary),
    getShowWatchedProgress(summary.ids.trakt),
  ]).then((results) => {
    [
      res.backdrop,
      res.show_poster,
      res.clear_logo,
      res.imdb_rating,
      res.trakt_rating,
      res.tmdb_data,
      res.reviews,
      res.actors,
      res.watched_progress,
    ] = results
    res.tmdb_rating = results[5]?.vote_average.toFixed(1)
  })

  if (localStorage.getItem('trakt-vue-user')) {
    // get my rating from ratings in local storage
    const { ratings } = JSON.parse(localStorage.getItem('trakt-vue-show-ratings')!)
    res.my_rating = ratings.find((rating: Trakt.Rating) => rating.show.ids.trakt === summary.ids.trakt)?.rating
  }

  return res
}

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {Object} show - trakt show object.
 * @returns {Object} Object containing images, ratings needed.
 */
export async function getMovieDetails(slug) {
  const res = {}
  const summary = await getMovieSummary(slug)
  const watched = JSON.parse(localStorage.getItem('trakt-vue-watched-movies'))

  summary.type = 'movie'

  await Promise.all([
    getMovieBackdrop(summary),
    getMoviePoster(summary),
    getMovieClearLogo(summary.ids.tmdb),
    getImdbRating(summary.ids.imdb),
    getMovieRating(summary.ids.trakt),
    tmdbMovieDetails(summary),
    getComments(summary),
    tmdbActors(summary),
  ]).then((results) => {
    [
      res.backdrop,
      res.poster,
      res.clear_logo,
      res.imdb_rating,
      res.trakt_rating,
      res.tmdb_data,
      res.reviews,
      res.actors,
    ] = results
    res.tmdb_rating = results[5]?.vote_average.toFixed(1)
    const haveWatched = watched?.find(item => item.movie.ids.trakt === summary.ids.trakt)
    res.watched_progress = haveWatched
      ? {
          ...haveWatched,
          ...{ type: 'movie' },
        }
      : null
  })

  // get my rating from ratings in local storage
  if (localStorage.getItem('trakt-vue-user')) {
    const { ratings } = JSON.parse(localStorage.getItem('trakt-vue-movie-ratings'))
    res.my_rating = ratings.find(rating => rating.movie.ids.trakt === summary.ids.trakt)?.rating
  }
  return { ...summary, ...res }
}

export async function getMovieCollection(collectionId) {
  const collection = await tmdbMovieCollection(collectionId)
  const watched = JSON.parse(localStorage.getItem('trakt-vue-watched-movies'))
  const parts = []

  await Promise.all(
    collection.parts.map(async (item) => {
      const trakt = await getIdLookupTmdb(item.id, 'movie')
      parts.push({
        ...item,
        ...{
          slug: trakt.ids?.slug,
          poster_path: `https://image.tmdb.org/t/p/w200${item.poster_path}`,
          watched_progress: watched?.find(
            watchedItems => watchedItems.movie.ids.tmdb === item.id,
          ),
        },
      })
    }),
  )

  collection.parts = parts.sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
  return collection
}
