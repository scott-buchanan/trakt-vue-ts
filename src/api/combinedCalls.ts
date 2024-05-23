import type Tmdb from './tmdb.types'
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
import { getMovieFanartInfo, getTvFanartInfo } from '~/api/fanart'
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
import type {
  CardInfo,
  EpisodeDetails,
  MovieDetails,
  SeasonDetails,
  ShowDetails,
} from '~/api/combinedCall.types'

export async function getEpisodeInfoCard(
  show: Trakt.Show,
  episode: Trakt.Episode,
): Promise<CardInfo | null> {
  if (!show.ids || !episode.ids)
    return null

  const [
    backdrop,
    fanartInfo,
    imdbRating,
    traktRating,
    tmdbDetails,
  ] = await Promise.all([
    getEpisodeBackdrop(show, episode),
    getTvFanartInfo(show.ids.tvdb),
    getImdbRating(episode.ids.imdb),
    getEpisodeRating(show.ids.trakt, episode.season, episode.number),
    tmdbEpisodeDetails(show, episode),
  ])

  const result: CardInfo = {
    backdrop,
    clear_logo: fanartInfo?.clearlogo,
    imdb_rating: imdbRating,
    trakt_rating: traktRating,
    tmdb_rating: tmdbDetails?.vote_average.toFixed(1),
    type: MediaType.episode,
  }

  return result
}

export async function getShowInfoCard(show: Trakt.Show): Promise<CardInfo | null> {
  if (!show.ids)
    return null

  const [
    backdrop,
    fanartInfo,
    imdbRating,
    traktRating,
    tmdbDetails,
  ] = await Promise.all([
    getShowBackdrop(show),
    getTvFanartInfo(show.ids.tvdb),
    getImdbRating(show.ids.imdb),
    getShowRating(show.ids.trakt),
    tmdbShowDetails(show),
  ])

  const result: CardInfo = {
    backdrop,
    clear_logo: fanartInfo?.clearLogo,
    imdb_rating: imdbRating,
    trakt_rating: traktRating,
    tmdb_rating: tmdbDetails?.vote_average.toFixed(1),
    genres: tmdbDetails?.genres,
    type: MediaType.show,
  }

  return result
}

export async function getMovieInfoCard(movie: Trakt.Movie): Promise<CardInfo | null> {
  if (!movie.ids)
    return null

  const [
    backdrop,
    fanartInfo,
    imdbRating,
    traktRating,
    tmdbDetails,
  ] = await Promise.all([
    getMovieBackdrop(movie),
    getMovieFanartInfo(movie.ids.tmdb),
    getImdbRating(movie.ids.imdb),
    getMovieRating(movie.ids.trakt),
    tmdbMovieDetails(movie),
  ])

  const res = {} as CardInfo
  res.backdrop = backdrop
  res.clear_logo = fanartInfo?.clearlogo
  res.imdb_rating = imdbRating
  res.trakt_rating = traktRating

  if (tmdbDetails) {
    res.tmdb_rating = tmdbDetails.vote_average.toFixed(1)
    res.genres = tmdbDetails.genres
  }

  res.type = MediaType.movie

  return res
}

// TODO: finish refactoring this file -- below
export async function getEpisodeDetails(
  slug: string,
  season: number,
  episode: number,
): Promise<EpisodeDetails | false> {
  const summary: Trakt.Episode = await getEpisodeSummary(slug, season, episode)
  const res: EpisodeDetails = {} as EpisodeDetails
  let show: Trakt.Show

  if (summary.ids) {
    show = (await getIdLookupTrakt(summary.ids.trakt)).show
    summary.type = MediaType.episode
    summary.slug = show.ids.slug

    const results = await Promise.all([
      getEpisodeBackdrop(show, summary),
      getSeasonPoster(show, summary.season),
      getTvFanartInfo(show.ids.tvdb),
      getImdbRating(summary.ids.imdb),
      getEpisodeRating(show.ids.trakt, summary.season, summary.number),
      getComments(summary),
      tmdbEpisodeActors(show, summary),
      tmdbEpisodeDetails(show, summary),
      getShowWatchedProgress(show.ids.trakt),
    ])

    res.backdrop = results[0]
    res.season_poster = results[1]
    res.clear_logo = results[2]?.clearlogo
    res.imdb_rating = results[3]
    res.trakt_rating = results[4]
    res.reviews = results[5]
    res.actors = results[6]
    res.tmdb_data = results[7]
    res.tmdb_rating = results[7]?.vote_average.toFixed(1) // Assuming tmdb_rating is derived from the same result as tmdb_data
    res.watched_progress = results[8]

    if (localStorage.getItem('trakt-vue-user')) {
      // get my rating from ratings in local storage
      const { ratings }: { ratings: Trakt.Rating[] } = JSON.parse(
        localStorage.getItem('trakt-vue-episode-ratings')!,
      )
      const myRating: Trakt.Rating | undefined = ratings.find((item) => {
        if (item.episode?.ids && summary.ids) {
          if (item.episode.ids.trakt === summary.ids.trakt)
            return item
        }
      })

      if (myRating)
        res.my_rating = myRating.rating
    }
    return { ...{ show }, ...summary, ...res }
  }
  return false
}

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {object} show - trakt show object.
 * @returns {object} Object containing images, ratings needed.
 */
export async function getSeasonDetails(
  slug: string,
  season: number,
): Promise<SeasonDetails | null> {
  const [show, seasonInfo] = await Promise.all([getShowSummary(slug), getSeasonSummary(slug, season)])

  if (!show.ids)
    return null

  const [backdrop, fanartInfo, tmdbData, reviews] = await Promise.all([
    getShowBackdrop(show),
    getTvFanartInfo(show.ids.tvdb),
    tmdbShowSeasonDetails(show, season),
    getComments(show),
  ])

  const seasonDetails: SeasonDetails = {
    backdrop,
    clear_logo: fanartInfo?.clearlogo,
    tmdb_data: tmdbData,
    reviews,
    trakt_rating: seasonInfo.rating.toFixed(1),
  }

  if (!tmdbData.poster_path)
    seasonDetails.tmdb_data.poster_path = await getShowPoster(show)
  else
    seasonDetails.tmdb_data.poster_path = `https://image.tmdb.org/t/p/w780${tmdbData.poster_path}`

  const user = localStorage.getItem('trakt-vue-user')
  if (user) {
    const { ratings }: { ratings: Trakt.Rating[] } = JSON.parse(
      localStorage.getItem('trakt-vue-season-ratings'),
    )
    const myRating = ratings.find(
      item => item.season?.ids?.trakt === seasonInfo.ids?.trakt,
    )
    if (myRating)
      seasonDetails.my_rating = myRating.rating
  }

  return { ...seasonDetails, ...seasonInfo, show }
}

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {object} show - trakt show object.
 * @returns {object} Object containing images, ratings needed.
 */
export async function getShowDetails(
  traktId: number | string,
): Promise<ShowDetails> {
  const summary = await getShowSummary(traktId)
  const res: any = { ...summary }

  const [
    backdrop,
    showPoster,
    fanartInfo,
    imdbRating,
    traktRating,
    tmdbData,
    reviews,
    actors,
    watchedProgress,
  ] = await Promise.all([
    getShowBackdrop(summary),
    getShowPoster(summary),
    getTvFanartInfo(summary.ids.tvdb),
    getImdbRating(summary.ids.imdb),
    getShowRating(summary.ids.trakt),
    tmdbShowDetails(summary),
    getComments(summary),
    tmdbActors(summary),
    getShowWatchedProgress(summary.ids.trakt),
  ])

  Object.assign(res, {
    backdrop,
    show_poster: showPoster,
    clear_logo: fanartInfo?.clearlogo,
    imdb_rating: imdbRating,
    trakt_rating: traktRating,
    tmdb_data: tmdbData,
    reviews,
    actors,
    watched_progress: watchedProgress,
    tmdb_rating: tmdbData?.vote_average?.toFixed(1),
  })

  const user = localStorage.getItem('trakt-vue-user')
  if (user) {
    const { ratings } = JSON.parse(
      localStorage.getItem('trakt-vue-show-ratings')!,
    )
    res.my_rating = ratings.find(
      (rating: Trakt.Rating) => rating.show.ids.trakt === summary.ids.trakt,
    )?.rating
  }

  return res
}

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {object} show - trakt show object.
 * @returns {object} Object containing images, ratings needed.
 */
export async function getMovieDetails(
  slug: string,
): Promise<MovieDetails | null> {
  const summary = await getMovieSummary(slug)
  if (!summary.ids)
    return null

  summary.type = 'movie'

  const [
    backdrop,
    poster,
    fanartInfo,
    imdbRating,
    traktRating,
    tmdbData,
    reviews,
    actors,
  ] = await Promise.all([
    getMovieBackdrop(summary),
    getMoviePoster(summary),
    getMovieFanartInfo(summary.ids.tmdb),
    getImdbRating(summary.ids.imdb),
    getMovieRating(summary.ids.trakt),
    tmdbMovieDetails(summary),
    getComments(summary),
    tmdbActors(summary),
  ])

  const movieDetails: MovieDetails = {
    ...summary,
    backdrop,
    poster,
    clear_logo: fanartInfo?.clearlogo,
    imdb_rating: imdbRating,
    trakt_rating: traktRating,
    tmdb_data: tmdbData,
    tmdb_rating: tmdbData?.vote_average?.toFixed(1),
    reviews,
    actors,
  }

  const watchedMovies: Trakt.WatchedMovie[] = localStorage.getItem(
    'trakt-vue-watched-movies',
  )
    ? JSON.parse(localStorage.getItem('trakt-vue-watched-movies')!)
    : []

  if (watchedMovies.length > 0) {
    movieDetails.watched_progress = watchedMovies.find(
      item => item.movie.ids.trakt === summary.ids.trakt,
    )
  }

  const user = localStorage.getItem('trakt-vue-user')
  if (user) {
    const { ratings }: { ratings: Trakt.Rating[] } = JSON.parse(
      localStorage.getItem('trakt-vue-movie-ratings')!,
    )

    const myRating = ratings.find(
      item => item.movie?.ids?.trakt === summary.ids.trakt,
    )
    if (myRating)
      movieDetails.my_rating = myRating.rating
  }

  return movieDetails
}

export async function getMovieCollection(collectionId: number) {
  const collection = await tmdbMovieCollection(collectionId)
  const watchedMovies: Trakt.WatchedMovie[] = localStorage.getItem(
    'trakt-vue-watched-movies',
  )
    ? JSON.parse(localStorage.getItem('trakt-vue-watched-movies')!)
    : null

  const parts = await Promise.all(
    collection.parts.map(async (item: Tmdb.MovieDetails) => {
      const ids = await getIdLookupTmdb(item.id, 'movie')

      if (ids && 'slug' in ids) {
        return {
          ...item,
          ...{
            slug: ids.slug,
            poster_path: `https://image.tmdb.org/t/p/w200${item.poster_path}`,
            watched_progress: watchedMovies.find(
              w => w.movie.ids.tmdb === item.id,
            ),
          },
        }
      }
    }),
  )

  collection.parts = parts.sort(
    (a: Tmdb.MovieDetails, b: Tmdb.MovieDetails) =>
      new Date(a.release_date).getTime() - new Date(b.release_date).getTime(),
  )

  return collection
}
