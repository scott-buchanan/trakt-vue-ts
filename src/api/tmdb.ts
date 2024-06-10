import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import dayjs from 'dayjs'
// api
import { getMovieFanartInfo, getTvFanartInfo } from './fanart'
import { getIdLookupActorTmdb, getIdLookupTmdb } from './trakt'
// types
import type Tmdb from './tmdb.types'
import type { Backdrop } from './combinedCall.types'
import type Trakt from '~/api/trakt.types'
import { MediaType } from '~/types/types'
// assets
import * as fallback from '~/assets/fallback-tv.jpg'

// base config for axios instances
const baseConfig: AxiosRequestConfig = {
  baseURL: 'https://api.themoviedb.org/3/',
  params: {
    api_key: import.meta.env.VITE_TMDB_API_KEY as string,
    language: 'en',
  },
}

// for public requests
const axiosInstance: AxiosInstance = axios.create(baseConfig)

axiosInstance.interceptors.response.use((response) => {
  return response
}, () => {
  return { data: null }
})

export async function getImageUrls(): Promise<Tmdb.TmdbConfig> {
  const response = await axiosInstance.get<Tmdb.TmdbConfig>('/configuration')
  return response.data
}

export async function getAppBackgroundImg(
  tmdbConfig: Tmdb.TmdbConfig,
): Promise<Tmdb.BackgroundInfo | null> {
  interface Item {
    id: number
    title: string
    name: string
    media_type: string
    release_date: string
    poster_path: string
    backdrop_path: string
  }
  interface ApiResponse {
    page: number
    results: Item[]
    total_pages: number
    total_results: number
  }
  const response = await axiosInstance.get<ApiResponse>('/trending/all/day')
  if (response.data) {
    const rando = Math.floor(Math.random() * response.data.results.length)
    const ids: Trakt.Ids | null = await getIdLookupTmdb(response.data.results[rando].id)
    const imgObj = response.data.results[rando]
    if (ids) {
      return {
        ids,
        title: imgObj.title ? imgObj.title : imgObj.name,
        type: imgObj.media_type,
        year: dayjs(imgObj.release_date).format('YYYY'),
        posterUrl: `${tmdbConfig.images.secure_base_url}${tmdbConfig.images.poster_sizes[3]}${imgObj.poster_path}`,
        backgroundUrl: `${tmdbConfig.images.secure_base_url}${tmdbConfig.images.backdrop_sizes[3]}${imgObj.backdrop_path}`,
      }
    }
  }
  return null
}

export async function getShowPoster(show: Trakt.Show): Promise<string | null> {
  interface ImagesResponse {
    posters: {
      file_path: string
    }[]
  }
  const response = await axiosInstance.get<ImagesResponse>(`/tv/${show.ids.tmdb}/images`)
  if (response.data) {
    if (response.data.posters.length > 0)
      return `https://image.tmdb.org/t/p/w780/${response.data.posters[0].file_path}`

    // Sometimes the details call has a poster where the images call does not.
    interface DetailsResponse {
      poster_path: string
    }
    const details = await axiosInstance.get<DetailsResponse>(`/tv/${show.ids.tmdb}`)
    return details.data?.poster_path
      ? `https://image.tmdb.org/t/p/w780/${details.data.poster_path}`
      : fallback.default
  }
  return null
}

export async function getSeasonPoster(show: Trakt.Show, seasonNumber: number) {
  const response = await axiosInstance.get(`/tv/${show.ids.tmdb}/season/${seasonNumber}/images`)
  if (response.data)
    return `https://image.tmdb.org/t/p/w780/${response.data.posters[0].file_path}`
  else
    return getShowPoster(show)
}

export async function getMoviePoster(movie: Trakt.Movie) {
  const response = await axiosInstance.get(`/movie/${movie.ids.tmdb}/images`)

  if (response.data) {
    if (response.data.posters.length > 0)
      return `https://image.tmdb.org/t/p/w780/${response.data.posters[0].file_path}`

    // Sometimes the details call has a poster where the images call does not. Weird.
    const details = await axiosInstance.get(`/movie/${movie.ids.tmdb}`)
    return details.data?.poster_path
      ? `https://image.tmdb.org/t/p/w780/${details.data.poster_path}`
      : fallback.default
  }
  return null
}

export async function getShowBackdrop(show: Trakt.Show) {
  if (show.ids.tmdb) {
    const response = await axiosInstance.get(`/tv/${show.ids.tmdb}/images?include_image_language=null`)
    if (response.data) {
      if (response.data.backdrops.length < 1) {
        const fanartInfo = await getTvFanartInfo(show.ids.tvdb)
        if (!fanartInfo) {
          return {
            backdrop_sm: fallback.default,
            backdrop_lg: fallback.default,
          }
        }
        else {
          return {
            backdrop_sm: fanartInfo.tvthumb[0]?.url,
            backdrop_lg: fanartInfo.tvthumb[0]?.url,
          }
        }
      }
      interface backdrop {
        vote_average: number
        height: number
      }
      response.data.backdrops.sort(
        (a: backdrop, b: backdrop) =>
          b.vote_average - a.vote_average || b.height - a.height,
      )
      return {
        backdrop_sm: `https://image.tmdb.org/t/p/w780${response.data.backdrops[0].file_path}`,
        backdrop_lg: `https://image.tmdb.org/t/p/w1280${response.data.backdrops[0].file_path}`,
      }
    }
    return { backdrop_sm: fallback.default, backdrop_lg: fallback.default }
  }
  else {
    return { backdrop_sm: fallback.default, backdrop_lg: fallback.default }
  }
}

export async function getEpisodeBackdrop(
  show: Trakt.Show,
  episode: Trakt.Episode,
): Promise<Backdrop | null> {
  if (!show.ids.tmdb && !episode.season && !episode.number)
    return null

  const response = await axiosInstance.get(`/tv/${show.ids.tmdb}/season/${episode.season}/episode/${episode.number}/images?include_image_language=null`)
  if (response.data?.stills?.length < 1) {
    return await getShowBackdrop(show)
  }
  else if (response.data.stills.length > 0) {
    return {
      backdrop_sm: `https://image.tmdb.org/t/p/w780${response.data.stills[0].file_path}`,
      backdrop_lg: `https://image.tmdb.org/t/p/w1280${response.data.stills[0].file_path}`,
    }
  }
  else {
    return await getShowBackdrop(show)
  }
}

export async function getMovieBackdrop(movie: Trakt.Movie): Promise<Backdrop | null> {
  if (movie.ids.tmdb) {
    interface respBackdrops {
      backdrops: respBackdrop[]
    }
    interface respBackdrop {
      file_path: string
    }
    const response = await axiosInstance.get<respBackdrops>(`/movie/${movie.ids.tmdb}/images?include_image_language=null`)
    if (response.data.backdrops.length > 0) {
      return {
        backdrop_sm: `https://image.tmdb.org/t/p/w780${response.data.backdrops[0].file_path}`,
        backdrop_lg: `https://image.tmdb.org/t/p/w1280${response.data.backdrops[0].file_path}`,
      }
    }
    else if (response.data.backdrops.length < 1) {
      const fanartInfo = await getMovieFanartInfo(movie.ids.tvdb)
      if (fanartInfo?.tvthumb[0]) {
        return {
          backdrop_sm: fanartInfo?.tvthumb[0].url,
          backdrop_lg: fanartInfo?.tvthumb[0].url,
        }
      }
      else {
        return { backdrop_sm: fallback.default, backdrop_lg: fallback.default }
      }
    }
    else {
      return { backdrop_sm: fallback.default, backdrop_lg: fallback.default }
    }
  }
  else {
    return { backdrop_sm: fallback.default, backdrop_lg: fallback.default }
  }
}

export async function tmdbEpisodeDetails(
  show: Trakt.Show,
  episode: Trakt.Episode,
): Promise<Tmdb.EpisodeDetails | null> {
  if (show.ids.tmdb && episode.season && episode.number) {
    const response = await axiosInstance.get<Tmdb.EpisodeDetails>(`/tv/${show.ids.tmdb}/season/${episode.season}/episode/${episode.number}`)
    return response.data
  }
  return null
}

export async function tmdbShowDetails(show: Trakt.Show): Promise<Tmdb.ShowDetails | null> {
  if (show.ids.tmdb) {
    const response = await axiosInstance.get<Tmdb.ShowDetails>(`/tv/${show.ids.tmdb}?append_to_response=videos`)
    const details: Tmdb.ShowDetails = { ...response.data }
    if (response.data && 'seasons' in response.data) {
      const seasons: Tmdb.Season[] = await Promise.all(
        response.data.seasons.map(async (season: Tmdb.Season) => {
          if (season.episode_count > 0) {
            let path
            if (!season.poster_path)
              path = await getShowPoster(show)
            else path = `https://image.tmdb.org/t/p/w200${season.poster_path}`

            return { ...season, ...{ poster_path: path } }
          }
          else {
            return { ...season, poster_path: null }
          }
        }),
      )
      details.seasons = seasons.sort(
        (a: Tmdb.Season, b: Tmdb.Season) => a.season_number - b.season_number,
      )

      if (details.seasons[0].name.toLowerCase() === 'specials') {
        const specials = details.seasons.shift()
        if (specials)
          response.data.seasons.push(specials)
      }

      if (response.data.videos && 'results' in response.data.videos) {
        details.videos = (response.data.videos.results as Tmdb.Video[]).filter(
          (v: Tmdb.Video) =>
            v.type.toLowerCase() === 'trailer' || v.type.toLowerCase() === 'teaser',
        )
      }
      else {
        details.videos = null
      }

      return details
    }
    return null
  }
  return null
}

export async function tmdbShowSeasonDetails(show: Trakt.Show, season: number) {
  try {
    const response = await axiosInstance.get(`/tv/${show.ids.tmdb}/season/${season}`)
    const episodes: Tmdb.EpisodeDetails[] = []
    await Promise.all(
      response.data.episodes.map(async (episode: Tmdb.EpisodeDetails) => {
        const ep: Trakt.Episode = {
          season: episode.season_number,
          number: episode.episode_number,
        }
        const backdrop = await getEpisodeBackdrop(show, ep)
        episodes.push({ ...episode, ...{ backdrop } })
      }),
    )

    episodes.sort((a, b) => a.episode_number - b.episode_number)

    return { ...response.data, ...{ episodes } }
  }
  catch {
    return null
  }
}

export async function tmdbMovieDetails(movie: Trakt.Movie): Promise<Tmdb.MovieDetails | null> {
  if (movie) {
    const response = await axiosInstance.get<Tmdb.MovieDetails>(`/movie/${movie.ids.tmdb}?append_to_response=videos`)

    const details = { ...response.data }
    if (response.data.videos && 'results' in response.data.videos) {
      details.videos = (response.data.videos.results as Tmdb.Video[]).filter(
        (v: Tmdb.Video) =>
          v.type.toLowerCase() === 'trailer' || v.type.toLowerCase() === 'teaser',
      )
    }
    else {
      details.videos = null
    }

    return details
  }
  return null
}

export async function tmdbEpisodeActors(
  show: Trakt.Show,
  episode: Trakt.Episode,
) {
  try {
    const response = await axiosInstance.get(`/tv/${show.ids.tmdb}/season/${episode.season}/episode/${episode.number}/credits`)
    const data = response.data.cast
    const actors: Tmdb.Actor[] = []
    await Promise.all(
      data.map(async (item: Tmdb.Actor) => {
        const actorIds = await getIdLookupActorTmdb(item.id)
        const path = `https://image.tmdb.org/t/p/w200${item.profile_path}`
        actors.push({
          ...item,
          ...{ profile_path: path },
          ids: actorIds.person.ids,
        })
      }),
    )
    return actors.sort((a, b) => a.order - b.order)
  }
  catch (error) {
    return []
  }
}

export async function tmdbActors(
  item: Trakt.Show | Trakt.Movie,
): Promise<Tmdb.Actor[]> {
  const mType: MediaType | string
    = item.type === MediaType.movie ? MediaType.movie : 'tv'
  const response = await axiosInstance.get(`/${mType}/${item.ids.tmdb}/credits`)
  const data = response.data.cast
  const actors: Tmdb.Actor[] = []
  await Promise.all(
    data.map(async (actor: Tmdb.Actor) => {
      const actorIds = await getIdLookupActorTmdb(actor.id)
      const path = `https://image.tmdb.org/t/p/w200${actor.profile_path}`
      actors.push({
        ...actor,
        ...{ profile_path: actor.profile_path ? path : null },
        ids: actorIds.person.ids,
      })
    }),
  )
  return actors.sort((a, b) => b.popularity - a.popularity)
}

export async function getActorImage(tmdbId: string) {
  const response = await axiosInstance.get(`/person/${tmdbId}/images`)
  return response.data
}

export async function rateEpisode(
  showId: number,
  season: number,
  episode: number,
  rating: number,
) {
  const response = await axiosInstance.post(`/tv/${showId}/season/${season}/episode/${episode}/rating`, {
    value: rating,
  })
  return response.status === 201
}

export async function getShowVideos(showId: number) {
  const response = await axiosInstance.get(`/tv/${showId}/videos`)
  return response.data.results
}

export async function getGenres(): Promise<Tmdb.Genres> {
  const response = await Promise.all([
    axiosInstance.get('/genre/tv/list'),
    axiosInstance.get('/genre/movie/list'),
  ])
  return {
    tv: response[0].data.genres,
    movie: response[1].data.genres,
  }
}

export async function getSearchResults(keyword: string, page = 1) {
  const response = await axiosInstance.get(`/search/multi?&query=${keyword}&include_adult=true&language=en-US&page=${page}`)
  const modified = await Promise.all(
    response.data.results.map(async (item: any) => {
      const ids = await getIdLookupTmdb(item.id, item.media_type)
      if (ids && 'trakt' in ids)
        item.ids = ids

      return item
    }),
  )
  return {
    results: modified.filter(r => r).sort((a, b) => b.popularity - a.popularity),
    page: response.data.page,
    pagesTotal: response.data.total_pages,
  }
}

export async function getMovieCollection(collectionId: number) {
  const response = await axiosInstance.get(`/collection/${collectionId}`)
  response.data.parts = response.data.parts
    .filter((c: Tmdb.MovieDetails) => c.release_date !== '')
    .sort((a: Tmdb.Collection, b: Tmdb.Collection) => (a.id < b.id ? 1 : -1))
  return response.data
}
