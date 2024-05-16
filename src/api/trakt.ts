import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import type Trakt from '~/api/trakt.types'

// item limit per page
const limit = 30

// base config for axios instances
const baseConfig: AxiosRequestConfig = {
  baseURL: 'https://api.trakt.tv',
  headers: {
    'trakt-api-version': '2',
    'trakt-api-key': import.meta.env.VITE_TRAKT_API_KEY,
  },
}

// for public requests
const axiosNoAuth: AxiosInstance = axios.create(baseConfig)

// for requests that require authentication
const axiosWithAuth: AxiosInstance = axios.create(baseConfig)

axiosWithAuth.interceptors.request.use(
  async (config) => {
    const tokenString: string | null = localStorage.getItem('trakt-vue-token')

    if (tokenString !== null) {
      const tokens: Trakt.AuthTokens = JSON.parse(tokenString)

      if (tokens?.access_token) {
        if (tokens.expires_in < 86400)
          await getToken(tokens.refresh_token, true)

        // add the Authorization header
        config.headers.Authorization = `Bearer ${tokens.access_token}`
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// -------- <AUTHENTICATION> -----------
export async function getToken(
  code: string,
  refresh: boolean = false,
): Promise<Trakt.AuthTokens> {
  const redirect_uri: string = import.meta.env.VITE_REDIRECT_URI as string
  const response = await axios({
    method: 'POST',
    url: 'https://api.trakt.tv/oauth/token',
    headers: { 'Content-Type': 'application/json' },
    data: {
      code,
      client_id: import.meta.env.VITE_TRAKT_API_KEY as string,
      client_secret: import.meta.env.VITE_TRAKT_CLIENT_SECRET as string,
      redirect_uri,

      grant_type: refresh ? 'refresh_token' : 'authorization_code',
    },
  })

  localStorage.setItem('trakt-vue-token', JSON.stringify(response.data))
  return response.data as Trakt.AuthTokens
}
// -------- </AUTHENTICATION> -----------

// -------- <SETTINGS> -----------
export async function getTraktSettings(): Promise<Trakt.MyInfo> {
  const response = await axiosWithAuth.get('/users/settings')
  localStorage.setItem('trakt-vue-user', JSON.stringify(response.data))
  return response.data as Trakt.MyInfo
}
// -------- </SETTINGS> -----------

// -------- <GET> -----------
/**
 * @property {string} rType can be shows or movies
 */
export async function getRecommendationsFromMe(
  recommendationType: 'shows' | 'movies',
  uName: string,
  page: string,
): Promise<Trakt.ShowData | Trakt.MovieData> {
  const response = await axiosWithAuth.get(
    `/users/${uName}/recommendations/${recommendationType}/rank?limit=${limit}&page=${page}`,
  )
  return {
    items: response.data,
    page: Number.parseInt(response.headers['x-pagination-page'], 10),
    pagesTotal: Number.parseInt(
      response.headers['x-pagination-page-count'],
      10,
    ),
  }
}

export async function getTrending(
  mType: 'shows' | 'movies',
  page: string,
): Promise<Trakt.ShowData | Trakt.MovieData> {
  const response = await axiosNoAuth.get(
    `/${mType}/trending?limit=${limit}&page=${page}`,
  )
  return {
    items: response.data,
    page: Number.parseInt(response.headers['x-pagination-page'], 10),
    pagesTotal: Number.parseInt(
      response.headers['x-pagination-page-count'],
      10,
    ),
  }
}

export async function getAnticipated(mType: 'shows' | 'movies', page: string) {
  const response = await axiosNoAuth.get(
    `/${mType}/anticipated?limit=${limit}&page=${page}`,
  )
  return {
    items: response.data,
    page: Number.parseInt(response.headers['x-pagination-page'], 10),
    pagesTotal: Number.parseInt(
      response.headers['x-pagination-page-count'],
      10,
    ),
  }
}

export async function getCommunityRecommended(
  mType: 'shows' | 'movies',
  page: string,
): Promise<Trakt.ShowData | Trakt.MovieData> {
  const response = await axiosNoAuth.get(
    `/${mType}/recommended?limit=${limit}&page=${page}`,
  )
  return {
    items: response.data,
    page: Number.parseInt(response.headers['x-pagination-page'], 10),
    pagesTotal: Number.parseInt(
      response.headers['x-pagination-page-count'],
      10,
    ),
  }
}

export async function getWatchedHistory(mType: 'shows' | 'movies', uName: string, page: string = '1'): Promise<Trakt.EpisodeData | Trakt.MovieData> {
  const response = await axiosNoAuth.get(
    `/users/${uName}/history/${mType}?limit=${limit}&page=${page}`,
  )
  let items
  if (mType === 'shows')
    items = response.data as Trakt.EpisodeWatchers
  else
    items = response.data as Trakt.MovieWatchers

  return {
    items,
    page: response.headers['x-pagination-page'],
    pagesTotal:
      response.headers['x-pagination-page-count'],
  }
}

export async function getTvCollection() {
  const uName = JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user
    .username
  // no pagination available for this
  const response = await axiosNoAuth.get(`/users/${uName}/collection/shows`)
  return response.data
}

export async function getShowSummary(
  showId: number | string,
): Promise<Trakt.Show> {
  const response = await axiosNoAuth.get(`/shows/${showId}?extended=full`)
  response.data.type = 'show'
  return response.data
}

export async function getMovieSummary(movieId: string) {
  const response = await axiosNoAuth.get(`/movies/${movieId}?extended=full`)
  response.data.type = 'movie'
  return response.data
}

export async function getEpisodeSummary(
  showId: string,
  season: number,
  episode: number,
): Promise<Trakt.Episode> {
  const response = await axiosNoAuth.get(
    `/shows/${showId}/seasons/${season}/episodes/${episode}?extended=full`,
  )
  response.data.type = 'episode'
  return response.data
}

export async function getSeasonSummary(slug: string, season: number) {
  const response = await axiosNoAuth.get(
    `/shows/${slug}/seasons?extended=full`,
  )
  return response.data.find((item: Trakt.Episode) => item.number === season)
}

export async function getEpisodeRating(
  showId: string,
  season: number,
  episode: number,
) {
  const response = await axiosNoAuth.get(
    `/shows/${showId}/seasons/${season}/episodes/${episode}/ratings`,
  )
  return response.data.rating.toFixed(1)
}

export async function getShowRating(showId: string) {
  const response = await axiosNoAuth.get(`/shows/${showId}/ratings`)
  return response.data.rating.toFixed(1)
}

export async function getMovieRating(movieId: string) {
  const response = await axiosNoAuth.get(`/movies/${movieId}/ratings`)
  return response.data.rating.toFixed(1)
}

export async function getShowActors(showId: number) {
  const response = await axiosNoAuth.get(`/shows/${showId}/people`)
  return response.data
}

export async function getMyEpisodeRatings(initial: boolean = false) {
  const uName: string = JSON.parse(localStorage.getItem('trakt-vue-user')!)
    ?.user.username
  const url = `https://api.trakt.tv/users/${uName}/ratings/episodes${initial ? '?limit=1' : ''}`
  const response = await axiosNoAuth.get(url)
  const ratings: Trakt.Ratings = {
    lastModified: response.headers['last-modified']!,
    total: response.headers['x-pagination-item-count']
      ? Number.parseInt(response.headers['x-pagination-item-count'])
      : response.data.length,
    type: 'episode',
    ratings: response.data,
  }
  return ratings
}

export async function getMySeasonRatings(initial: boolean = false) {
  const uName: string = JSON.parse(localStorage.getItem('trakt-vue-user')!)
    ?.user.username
  const url: string = `https://api.trakt.tv/users/${uName}/ratings/seasons${initial ? '?limit=1' : ''}`
  const response = await axiosNoAuth.get(url)
  const ratings: Trakt.Ratings = {
    lastModified: response.headers['last-modified']!,
    total: response.headers['x-pagination-item-count']
      ? Number.parseInt(response.headers['x-pagination-item-count'])
      : response.data.length,
    type: 'season',
    ratings: response.data,
  }
  return ratings
}

export async function getMyShowRatings(initial: boolean = false) {
  const uName: string = JSON.parse(localStorage.getItem('trakt-vue-user')!)
    ?.user.username
  const url: string = `https://api.trakt.tv/users/${uName}/ratings/shows${initial ? '?limit=1' : ''}`
  const response = await axiosNoAuth.get(url)
  const ratings: Trakt.Ratings = {
    lastModified: response.headers['last-modified']!,
    total: response.headers['x-pagination-item-count']
      ? Number.parseInt(response.headers['x-pagination-item-count'])
      : response.data.length,
    type: 'show',
    ratings: response.data,
  }
  return ratings
}

export async function getMyMovieRatings(initial: boolean = false) {
  const uName: string = JSON.parse(localStorage.getItem('trakt-vue-user')!)
    ?.user.username
  const url = `https://api.trakt.tv/users/${uName}/ratings/movies${initial ? `?limit=1` : ''}`
  const response = await axiosNoAuth.get(url)
  const ratings: Trakt.Ratings = {
    lastModified: response.headers['last-modified']!,
    total: response.headers['x-pagination-item-count']
      ? Number.parseInt(response.headers['x-pagination-item-count'])
      : response.data.length,
    type: 'movie',
    ratings: response.data,
  }
  return ratings
}

export async function getMyLikes(page?: number) {
  const uName: string = JSON.parse(localStorage.getItem('trakt-vue-user')!)
    ?.user.username
  const url: string = `https://api.trakt.tv/users/${uName}/likes/comments?limit=10&page=${page}`
  const response = await axiosWithAuth.get(url)
  const likes: Trakt.Like[] = response.data
  return likes
}

export async function getComments(
  item: any,
  reply = false,
): Promise<Trakt.Comments> {
  let url

  if (reply) {
    url = `https://api.trakt.tv/comments/${item}/replies`
  }
  else if (item.type === 'episode') {
    const episode = item as Trakt.Episode
    url = `https://api.trakt.tv/shows/${episode.slug}/seasons/${episode.season}/episodes/${episode.number}/comments/likes`
  }
  else if (item.type === 'season') {
    const season = item as Trakt.Season
    url = `https://api.trakt.tv/shows/${season.ids.slug}/seasons/${season.number}/comments/likes`
  }
  else if (item.type === 'show') {
    const show = item as Trakt.Show
    url = `https://api.trakt.tv/shows/${show.ids.trakt}/comments/likes`
  }
  else {
    url = `https://api.trakt.tv/movies/${item.ids.trakt}/comments/likes`
  }

  const response = await axiosNoAuth.get(url)
  const returnVal = await Promise.all(
    response.data.map(async (comment: Trakt.Comment) => {
      try {
        const info = await axiosNoAuth.get(
          `https://api.trakt.tv/users/${comment.user.ids.slug}?extended=full`,
        )
        const defaultAvatar
          = info.data.gender === 'female'
            ? 'https://i2.wp.com/walter.trakt.tv/hotlink-ok/placeholders/medium/leela.png'
            : 'https://i2.wp.com/walter.trakt.tv/hotlink-ok/placeholders/medium/fry.png'
        return {
          ...comment,
          ...{
            avatar: info.data.images
              ? info.data.images?.avatar.full
              : defaultAvatar,
          },
        }
      }
      catch {
        return {
          ...comment,
          ...{
            avatar:
              'https://i2.wp.com/walter.trakt.tv/hotlink-ok/placeholders/medium/fry.png',
          },
        }
      }
    }),
  )
  return {
    total: response.headers['x-pagination-item-count'],
    comments: returnVal,
  }
}

export async function getShowWatchedProgress(
  showId: string,
): Promise<Trakt.WatchedProgress | null> {
  const url: string = `https://api.trakt.tv/shows/${showId}/progress/watched?hidden=false&specials=false&count_specials=false`
  const response = await axiosWithAuth.get(url)
  return { ...response.data, ...{ type: 'show' } }
}

// export async function getMyWatchedMovies(): Promise<Trakt.WatchedMovie> {
//   const response = await axiosWithAuth.get(
//     'https://api.trakt.tv/sync/watched/movies',
//   )
//   localStorage.setItem(
//     'trakt-vue-watched-movies',
//     JSON.stringify(response.data),
//   )
//   return response.data as Trakt.WatchedMovie
// }

export async function getIdLookupTmdb(
  id: number,
  mType: string | null = null,
): Promise<Trakt.Ids | false> {
  const mediaType = mType === 'tv' ? 'show' : mType
  const url: string = `https://api.trakt.tv/search/tmdb/${id}${mType !== null ? `?type=${mediaType}` : ''}`
  const response = await axiosNoAuth.get(url)
  return response.data.length > 0
    ? response.data[0][response.data[0].type].ids
    : false
}

export async function getIdLookupTrakt(id: string, mType = null) {
  const url = `https://api.trakt.tv/search/trakt/${id}${mType ? `?type=${mType}` : null}`
  const response = await axiosNoAuth.get(url)
  return response.data[0]
}

export async function getIdLookupActorTmdb(id: number) {
  const url: string = `https://api.trakt.tv/search/tmdb/${id}?type=person`
  const response = await axiosNoAuth.get(url)
  return response.data[0]
}

export async function searchAutocomplete(keyword: string) {
  const url: string = `https://api.trakt.tv/search/movie,show?query=${keyword}`
  const response = await axiosNoAuth.get(url)
  return response.data
}
// -------- </GET> -----------

// -------- <POST> -----------
export async function rateShow(show: Trakt.Show, rating: number) {
  const url = `https://api.trakt.tv/sync/ratings${rating === 0 ? '/remove' : ''}`
  const response = await axiosWithAuth.post(url, {
    shows: [
      {
        rating,
        ids: show.ids,
      },
    ],
  })
  return response.status === 201 || response.status === 200
}

export async function rateSeason(season: Trakt.Season, rating: number) {
  const url = `https://api.trakt.tv/sync/ratings${rating === 0 ? '/remove' : ''}`
  const response = await axiosWithAuth.post(url, {
    seasons: [
      {
        rating,
        ids: season.ids,
      },
    ],
  })
  return response.status === 201 || response.status === 200
}

export async function rateEpisode(episode: Trakt.Episode, rating: number) {
  const url = `https://api.trakt.tv/sync/ratings${rating === 0 ? '/remove' : ''}`
  const response = await axiosWithAuth.post(url, {
    episodes: [
      {
        rating,
        ids: episode.ids,
      },
    ],
  })
  const success = response.status === 201 || response.status === 200
  return success
}

export async function rateMovie(movie: Trakt.Movie, rating: number) {
  const url = `https://api.trakt.tv/sync/ratings${rating === 0 ? '/remove' : ''}`
  const response = await axiosWithAuth.post(url, {
    movies: [
      {
        rating,
        ids: movie.ids,
      },
    ],
  })
  const success = response.status === 201 || response.status === 200
  return success
}

export async function likeComment(id: number, deleteComment = false) {
  const url = `https://api.trakt.tv/comments/${id}/like`
  let response
  if (deleteComment)
    response = await axiosWithAuth.delete(url)
  else
    response = await axiosWithAuth.post(url)

  return response.status === 204
}
// -------- </POST> -----------
