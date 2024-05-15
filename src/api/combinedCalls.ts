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
) {
  const res = {} as CardInfo

  if (episode.ids) {
    await Promise.all([
      getEpisodeBackdrop(show, episode),
      getShowClearLogo(show.ids.tvdb),
      getImdbRating(episode.ids.imdb),
      getEpisodeRating(show.ids.trakt, episode.season, episode.number),
      tmdbEpisodeDetails(show, episode),
    ]).then((results) => {
      [res.backdrop, res.clear_logo, res.imdb_rating, res.trakt_rating]
        = results
      res.tmdb_rating = results[4]?.vote_average.toFixed(1)
      res.type = MediaType.episode
    })
    return res
  }
}

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
      getShowClearLogo(show.ids.tvdb),
      getImdbRating(summary.ids.imdb),
      getEpisodeRating(show.ids.trakt, summary.season, summary.number),
      getComments(summary),
      tmdbEpisodeActors(show, summary),
      tmdbEpisodeDetails(show, summary),
      getShowWatchedProgress(show.ids.trakt),
    ])

    res.backdrop = results[0]
    res.season_poster = results[1]
    res.clear_logo = results[2]
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
): Promise<SeasonDetails | false> {
  const res: SeasonDetails = {} as SeasonDetails
  const show: Trakt.Show = await getShowSummary(slug)
  const seasonInfo = await getSeasonSummary(slug, season)

  if (show.ids) {
    [res.backdrop, res.clear_logo, res.tmdb_data, res.reviews]
      = await Promise.all([
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
      const { ratings }: { ratings: Trakt.Rating[] } = JSON.parse(
        localStorage.getItem('trakt-vue-season-ratings')!,
      )

      const myRating: Trakt.Rating | undefined = ratings.find((item) => {
        if (item.season?.ids && seasonInfo.ids) {
          if (item.season.ids.trakt === seasonInfo.ids.trakt)
            return item
        }
      })

      if (myRating)
        res.my_rating = myRating.rating
    }
    return { ...res, ...seasonInfo, ...{ show } }
  }
  return false
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
  const summary: Trakt.Show = await getShowSummary(traktId)
  const res: any = { ...summary }

  await Promise.all([
    getShowBackdrop(summary),
    getShowPoster(summary),
    getShowClearLogo(summary.ids.tvdb),
    getImdbRating(summary.ids.imdb),
    getShowRating(summary.ids.trakt),
    tmdbShowDetails(summary),
    getComments(summary),
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
): Promise<MovieDetails | false> {
  const summary = await getMovieSummary(slug)
  const res: MovieDetails = {} as MovieDetails

  if (summary.ids) {
    summary.type = 'movie'

    const results = await Promise.all([
      getMovieBackdrop(summary),
      getMoviePoster(summary),
      getMovieClearLogo(summary.ids.tmdb),
      getImdbRating(summary.ids.imdb),
      getMovieRating(summary.ids.trakt),
      tmdbMovieDetails(summary),
      getComments(summary),
      tmdbActors(summary),
    ])
    res.backdrop = results[0]
    res.poster = results[1]
    res.clear_logo = results[2]
    res.imdb_rating = results[3]
    res.trakt_rating = results[4]
    res.tmdb_data = results[5]
    res.tmdb_rating = results[5]?.vote_average.toFixed(1)
    res.reviews = results[6]
    res.actors = results[7]

    const watchedMovies: Trakt.WatchedMovie[] = localStorage.getItem(
      'trakt-vue-watched-movies',
    )
      ? JSON.parse(localStorage.getItem('trakt-vue-watched-movies')!)
      : null

    if (watchedMovies) {
      res.watched_progress = watchedMovies.find(
        item => item.movie.ids.trakt === summary.ids.trakt,
      )
    }

    if (localStorage.getItem('trakt-vue-user')) {
      // get my rating from ratings in local storage
      const { ratings }: { ratings: Trakt.Rating[] } = JSON.parse(
        localStorage.getItem('trakt-vue-movie-ratings')!,
      )

      const myRating: Trakt.Rating | undefined = ratings.find((item) => {
        if (item.movie?.ids && summary.ids) {
          if (item.movie.ids.trakt === summary.ids.trakt)
            return item
        }
      })

      if (myRating)
        res.my_rating = myRating.rating
    }
    return { ...summary, ...res }
  }
  return false
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
