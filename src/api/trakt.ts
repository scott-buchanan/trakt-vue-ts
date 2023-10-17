import axios from 'axios'
import type Trakt from '~/api/trakt.types'

// -------- <AUTHENTICATION> -----------
export async function getToken(code: string) {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.trakt.tv/oauth/token',
      headers: { 'Content-Type': 'application/json' },
      data: {
        code,
        client_id: '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
        client_secret: '93e1f2eb9e3c9e43cb06db7fd98feb630e8c90157579fa9af723d7181884ecb1',
        redirect_uri: 'http://localhost:8080',
        grant_type: 'authorization_code',
      },
    })
    return response.data
  }
  catch {
    return null
  }
}

export async function getTokenFromRefresh(refreshToken: string, path: string) {
  const response = await axios({
    method: 'POST',
    url: 'https://api.trakt.tv/oauth/token',
    headers: { 'Content-Type': 'application/json' },
    data: {
      refresh_token: refreshToken,
      client_id: '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
      client_secret: '93e1f2eb9e3c9e43cb06db7fd98feb630e8c90157579fa9af723d7181884ecb1',
      redirect_uri: `http://localhost:8080${path}`,
      grant_type: 'refresh_token',
    },
  })
  return response.data
}
// -------- </AUTHENTICATION> -----------

// -------- <SETTINGS> -----------
export async function getTraktSettings(token: string) {
  const response = await axios({
    method: 'GET',
    url: 'https://api.trakt.tv/users/settings',
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'Authorization': `Bearer ${token}`,
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  localStorage.setItem('trakt-vue-user', JSON.stringify(response.data))
  return response.data
}
// -------- </SETTINGS> -----------

// -------- <GET> -----------
/**
 * @property {string} rType can be shows or movies
 */
export async function getRecommendationsFromMe(rType: string, page: number) {
  const uName: string = JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user.username
  const limit: string = JSON.parse(localStorage.getItem('item-limit')!)
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/users/${uName}/recommendations/${rType}/rank?limit=${limit}&page=${page}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JSON.parse(localStorage.getItem('trakt-vue-token')!).access_token}`,
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return {
    items: response.data,
    page: Number.parseInt(response.headers['x-pagination-page'], 10),
    pagesTotal: Number.parseInt(response.headers['x-pagination-page-count'], 10),
  }
}

export async function getTrending(mType: string, page: number): Promise<{ items: Trakt.Show; page: number; pagesTotal: number }> {
  const limit = JSON.parse(localStorage.getItem('item-limit')!)
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/${mType}/trending?limit=${limit}&page=${page}`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return {
    items: response.data,
    page: Number.parseInt(response.headers['x-pagination-page'], 10),
    pagesTotal: Number.parseInt(response.headers['x-pagination-page-count'], 10),
  }
}

export async function getAnticipated(mType: string, page: number) {
  const limit = JSON.parse(localStorage.getItem('item-limit')!)
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/${mType}/anticipated?limit=${limit}&page=${page}`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return {
    items: response.data,
    page: Number.parseInt(response.headers['x-pagination-page'], 10),
    pagesTotal: Number.parseInt(response.headers['x-pagination-page-count'], 10),
  }
}

export async function getCommunityRecommended(mType: string, page: number): Promise<{ items: Trakt.Show; page: number; pagesTotal: number }> {
  const limit = JSON.parse(localStorage.getItem('item-limit')!)
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/${mType}/recommended?limit=${limit}&page=${page}`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return {
    items: response.data,
    page: Number.parseInt(response.headers['x-pagination-page'], 10),
    pagesTotal: Number.parseInt(response.headers['x-pagination-page-count'], 10),
  }
}

export async function getWatchedHistory(mType: string, page = 1) {
  const uName = JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user.username
  const limit = JSON.parse(localStorage.getItem('item-limit')!)
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/users/${uName}/history/${mType}?limit=${limit}&page=${page}`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return {
    items: response.data,
    page: Number.parseInt(response.headers['x-pagination-page'], 10),
    pagesTotal: Number.parseInt(response.headers['x-pagination-page-count'], 10),
  }
}

export async function getTvCollection() {
  const uName = JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user.username
  // no pagination available for this
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/users/${uName}/collection/shows`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return response.data
}

export async function getShowSummary(showId: number | string): Promise<Trakt.Show | null> {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://api.trakt.tv/shows/${showId}?extended=full`,
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
      },
    })
    return response.data
  }
  catch {
    return null
  }
}

export async function getMovieSummary(movieId: string) {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://api.trakt.tv/movies/${movieId}?extended=full`,
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
      },
    })
    return response.data
  }
  catch {
    return null
  }
}

export async function getEpisodeSummary(showId, season, episode) {
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/shows/${showId}/seasons/${season}/episodes/${episode}?extended=full`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return response.data
}

export async function getSeasonSummary(slug: string, season: number) {
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/shows/${slug}/seasons?extended=full`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return response.data.find((item: Trakt.Episode) => item.number === season)
}

export async function getEpisodeRating(showId, season, episode) {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://api.trakt.tv/shows/${showId}/seasons/${season}/episodes/${episode}/ratings`,
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
      },
    })
    return response.data.rating.toFixed(1)
  }
  catch {
    return null
  }
}

export async function getShowRating(showId: string) {
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/shows/${showId}/ratings`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return response.data.rating.toFixed(1)
}

export async function getMovieRating(movieId) {
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/movies/${movieId}/ratings`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return response.data.rating.toFixed(1)
}

export async function getShowActors(showId: number) {
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/shows/${showId}/people`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return response.data
}

export async function getMyEpisodeRatings(page?: number) {
  const uName: string = JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user.username
  const url = page
    ? `https://api.trakt.tv/users/${uName}/ratings/episodes?limit=10&page=${page}`
    : `https://api.trakt.tv/users/${uName}/ratings/episodes`
  const response = await axios({
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  const ratings: Ratings = {
    lastModified: response.headers['last-modified']!,
    total: response.headers['x-pagination-item-count']
      ? response.headers['x-pagination-item-count']
      : response.data.length,
    ratings: response.data,
  }
  return ratings
}

export async function getMySeasonRatings(page?: number) {
  const uName = JSON.parse(localStorage.getItem('trakt-vue-user'))?.user.username
  const url = page
    ? `https://api.trakt.tv/users/${uName}/ratings/seasons?limit=10&page=${page}`
    : `https://api.trakt.tv/users/${uName}/ratings/seasons`
  const response = await axios({
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  const ratings: Ratings = {
    lastModified: response.headers['last-modified']!,
    total: response.headers['x-pagination-item-count']
      ? response.headers['x-pagination-item-count']
      : response.data.length,
    ratings: response.data,
  }
  return ratings
}

export async function getMyShowRatings(page?: number) {
  const uName: string = JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user.username
  const url: string = page
    ? `https://api.trakt.tv/users/${uName}/ratings/shows?limit=10&page=${page}`
    : `https://api.trakt.tv/users/${uName}/ratings/shows`
  const response = await axios({
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  const ratings: Trakt.Ratings = {
    lastModified: response.headers['last-modified']!,
    total: response.headers['x-pagination-item-count']
      ? response.headers['x-pagination-item-count']
      : response.data.length,
    ratings: response.data,
  }
  return ratings
}

export async function getMyMovieRatings(page?: number) {
  const uName: String = JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user.username
  const url = page
    ? `https://api.trakt.tv/users/${uName}/ratings/movies?limit=10&page=${page}`
    : `https://api.trakt.tv/users/${uName}/ratings/movies`
  const response = await axios({
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  const ratings: Trakt.Ratings = {
    lastModified: response.headers['last-modified']!,
    total: response.headers['x-pagination-item-count']
      ? response.headers['x-pagination-item-count']
      : response.data.length,
    ratings: response.data,
  }
  return ratings
}

export async function getMyLikes(page?: number) {
  const uName: string = JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user.username
  const url = `https://api.trakt.tv/users/${uName}/likes/comments?limit=10&page=${page}`
  const response = await axios({
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JSON.parse(localStorage.getItem('trakt-vue-token')).access_token}`,
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  const likes: Trakt.Like[] = response.data
  return likes
}

export async function getComments(item: Trakt.Show | Trakt.Episode | Trakt.Season | Trakt.Movie, mType: string, reply = false) {
  let url
  console.log(mType)
  if (reply)
    url = `https://api.trakt.tv/comments/${item}/replies`
  else if (mType === 'episode')
    url = `https://api.trakt.tv/shows/${item.slug}/seasons/${item.season}/episodes/${item.number}/comments/likes`
  else if (mType === 'season')
    url = `https://api.trakt.tv/shows/${item.ids.slug}/seasons/${item.season}/comments/likes`
  else if (mType === 'show')
    url = `https://api.trakt.tv/shows/${item.ids.trakt}/comments/likes`
  else
    url = `https://api.trakt.tv/movies/${item.ids.trakt}/comments/likes`
  const response = await axios({
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  console.log(response)
  const returnVal = await Promise.all(
    response.data.map(async (comment: Trakt.Comment) => {
      try {
        const info = await axios({
          method: 'GET',
          url: `https://api.trakt.tv/users/${comment.user.ids.slug}?extended=full`,
          headers: {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
          },
        })
        const defaultAvatar
          = info.data.gender === 'female'
            ? 'https://i2.wp.com/walter.trakt.tv/hotlink-ok/placeholders/medium/leela.png'
            : 'https://i2.wp.com/walter.trakt.tv/hotlink-ok/placeholders/medium/fry.png'
        return {
          ...comment,
          ...{ avatar: info.data.images ? info.data.images?.avatar.full : defaultAvatar },
        }
      }
      catch {
        return {
          ...comment,
          ...{
            avatar: 'https://i2.wp.com/walter.trakt.tv/hotlink-ok/placeholders/medium/fry.png',
          },
        }
      }
    }),
  )
  return { total: response.headers['x-pagination-item-count'], comments: returnVal }
}

export async function getShowWatchedProgress(showId) {
  const uName: string = JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user.username
  if (uName) {
    const response = await axios({
      method: 'GET',
      url: `https://api.trakt.tv/shows/${showId}/progress/watched?hidden=false&specials=false&count_specials=false`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('trakt-vue-token')).access_token}`,
        'trakt-api-version': '2',
        'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
      },
    })
    return { ...response.data, ...{ type: 'show' } }
  }
  return null
}

export async function getMyWatchedMovies() {
  const response = await axios({
    method: 'GET',
    url: 'https://api.trakt.tv/sync/watched/movies',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JSON.parse(localStorage.getItem('trakt-vue-token')).access_token}`,
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return response.data
}

export async function getIdLookupTmdb(id: number, mType: string | null = null): Promise<{ ids: Trakt.Ids | null }> {
  const mediaType = mType === 'tv' ? 'show' : 'movie'
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/search/tmdb/${id}${mType !== null ? `?type=${mediaType}` : ''}`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return { ids: response.data.length > 0 ? response.data[0][response.data[0].type].ids : null }
}

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {String} id - trakt id or slug.
 * @param {String} mType - media type: can be movie, show, episode, person
 * @returns {Object} Object containing images, ratings needed.
 */
export async function getIdLookupTrakt(id, mType = null) {
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/search/trakt/${id}${mType ? `?type=${mType}` : null}`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return response.data[0]
}

export async function getIdLookupActorTmdb(id) {
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/search/tmdb/${id}?type=person`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return response.data[0]
}

export async function searchAutocomplete(keyword) {
  const response = await axios({
    method: 'GET',
    url: `https://api.trakt.tv/search/movie,show?query=${keyword}`,
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return response.data
}
// -------- </GET> -----------

// -------- <POST> -----------
export async function rateShow(show: Trakt.Show, rating: number) {
  const response = await axios({
    method: 'POST',
    url: `https://api.trakt.tv/sync/ratings${rating === 0 ? '/remove' : ''}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JSON.parse(localStorage.getItem('trakt-vue-token')!).access_token}`,
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
    data: {
      shows: [
        {
          rating,
          ids: show.ids,
        },
      ],
    },
  })
  return response.status === 201 || response.status === 200
}

export async function rateSeason(season, rating) {
  const response = await axios({
    method: 'POST',
    url: `https://api.trakt.tv/sync/ratings${rating === 0 ? '/remove' : ''}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JSON.parse(localStorage.getItem('trakt-vue-token')).access_token}`,
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
    data: {
      seasons: [
        {
          rating,
          ids: season.ids,
        },
      ],
    },
  })
  return response.status === 201 || response.status === 200
}

export async function rateEpisode(episode, rating) {
  const response = await axios({
    method: 'POST',
    url: `https://api.trakt.tv/sync/ratings${rating === 0 ? '/remove' : ''}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JSON.parse(localStorage.getItem('trakt-vue-token')).access_token}`,
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
    data: {
      episodes: [
        {
          rating,
          ids: episode.ids,
        },
      ],
    },
  })
  const success = response.status === 201 || response.status === 200
  // if (success) {
  //   const ratings = JSON.parse(localStorage.getItem('trakt-vue-episode-ratings'));
  //   ratings.ratings.push({ rating, show: episode.show, episode: episode.ids });
  // }
  return success
}

export async function rateMovie(movie, rating) {
  const response = await axios({
    method: 'POST',
    url: `https://api.trakt.tv/sync/ratings${rating === 0 ? '/remove' : ''}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JSON.parse(localStorage.getItem('trakt-vue-token')).access_token}`,
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
    data: {
      movies: [
        {
          rating,
          ids: movie.ids,
        },
      ],
    },
  })
  const success = response.status === 201 || response.status === 200
  // if (success) {
  //   const ratings = JSON.parse(localStorage.getItem('trakt-vue-movie-ratings'));
  //   ratings.ratings.push({ rating, movie });
  // }
  return success
}

export async function likeComment(id, deleteComment = false) {
  const response = await axios({
    method: deleteComment ? 'DELETE' : 'POST',
    url: `https://api.trakt.tv/comments/${id}/like`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JSON.parse(localStorage.getItem('trakt-vue-token')).access_token}`,
      'trakt-api-version': '2',
      'trakt-api-key': '8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3',
    },
  })
  return response.status === 204
}
// -------- </POST> -----------
