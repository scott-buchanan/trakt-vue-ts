import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import type Trakt from "~/api/trakt.types";

let tokens: Trakt.AuthTokens = JSON.parse(
  localStorage.getItem("trakt-vue-token")!,
);

// Base config for Axios instances
const baseConfig: AxiosRequestConfig = {
  baseURL: "https://api.trakt.tv",
  headers: {
    "trakt-api-version": "2",
    "trakt-api-key": import.meta.env.VITE_TRAKT_API_KEY,
  },
};

const axiosNoAuth: AxiosInstance = axios.create(baseConfig);
const axiosWithAuth: AxiosInstance = axios.create(baseConfig);

axiosWithAuth.interceptors.request.use(
  async (config) => {
    if (tokens?.access_token) {
      if (tokens.expires_in < 86400) {
        tokens = await getToken(tokens.refresh_token, true);
        localStorage.setItem("trakt-vue-token", JSON.stringify(tokens));
      }

      // add the Authorization header
      config.headers.Authorization = `Bearer ${tokens.access_token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// -------- <AUTHENTICATION> -----------
export async function getToken(
  code: string,
  refresh: boolean = false,
): Promise<Trakt.AuthTokens> {
  const redirect_uri: string = import.meta.env.VITE_REDIRECT_URI;
  const response = await axios({
    method: "POST",
    url: "https://api.trakt.tv/oauth/token",
    headers: { "Content-Type": "application/json" },
    data: {
      code,
      client_id: import.meta.env.VITE_TRAKT_API_KEY,
      client_secret: import.meta.env.VITE_TRAKT_CLIENT_SECRET,
      redirect_uri,
      grant_type: refresh ? "refresh_token" : "authorization_code",
    },
  });
  return response.data;
}
// -------- </AUTHENTICATION> -----------

// -------- <SETTINGS> -----------
export async function getTraktSettings() {
  const response = await axiosWithAuth.get("/users/settings");
  localStorage.setItem("trakt-vue-user", JSON.stringify(response.data));
  return response.data;
}
// -------- </SETTINGS> -----------

// -------- <GET> -----------
/**
 * @property {string} rType can be shows or movies
 */
export async function getRecommendationsFromMe(
  recommendationType: string,
  page: number,
) {
  const uName: string = JSON.parse(localStorage.getItem("trakt-vue-user")!)
    ?.user.username;
  const limit: string = JSON.parse(localStorage.getItem("item-limit")!);
  const response = await axiosWithAuth.get(
    `/users/${uName}/recommendations/${recommendationType}/rank?limit=${limit}&page=${page}`,
  );
  return {
    items: response.data,
    page: Number.parseInt(response.headers["x-pagination-page"], 10),
    pagesTotal: Number.parseInt(
      response.headers["x-pagination-page-count"],
      10,
    ),
  };
}

export async function getTrending(
  mType: string,
  page: number,
): Promise<{ items: Trakt.Show; page: number; pagesTotal: number }> {
  const limit = JSON.parse(localStorage.getItem("item-limit")!);
  const response = await axiosNoAuth.get(
    `/${mType}/trending?limit=${limit}&page=${page}`,
  );
  return {
    items: response.data,
    page: Number.parseInt(response.headers["x-pagination-page"], 10),
    pagesTotal: Number.parseInt(
      response.headers["x-pagination-page-count"],
      10,
    ),
  };
}

export async function getAnticipated(mType: string, page: number) {
  const limit = JSON.parse(localStorage.getItem("item-limit")!);
  const response = await axiosNoAuth.get(
    `/${mType}/anticipated?limit=${limit}&page=${page}`,
  );
  return {
    items: response.data,
    page: Number.parseInt(response.headers["x-pagination-page"], 10),
    pagesTotal: Number.parseInt(
      response.headers["x-pagination-page-count"],
      10,
    ),
  };
}

export async function getCommunityRecommended(
  mType: string,
  page: number,
): Promise<{ items: Trakt.Show; page: number; pagesTotal: number }> {
  const limit = JSON.parse(localStorage.getItem("item-limit")!);
  const response = await axiosNoAuth.get(
    `/${mType}/recommended?limit=${limit}&page=${page}`,
  );
  return {
    items: response.data,
    page: Number.parseInt(response.headers["x-pagination-page"], 10),
    pagesTotal: Number.parseInt(
      response.headers["x-pagination-page-count"],
      10,
    ),
  };
}

export async function getWatchedHistory(mType: string, page = 1) {
  const uName = JSON.parse(localStorage.getItem("trakt-vue-user")!)?.user
    .username;
  const limit = JSON.parse(localStorage.getItem("item-limit")!);
  const response = await axiosNoAuth.get(
    `/users/${uName}/history/${mType}?limit=${limit}&page=${page}`,
  );
  return {
    items: response.data,
    page: Number.parseInt(response.headers["x-pagination-page"], 10),
    pagesTotal: Number.parseInt(
      response.headers["x-pagination-page-count"],
      10,
    ),
  };
}

export async function getTvCollection() {
  const uName = JSON.parse(localStorage.getItem("trakt-vue-user")!)?.user
    .username;
  // no pagination available for this
  const response = await axiosNoAuth.get(`/users/${uName}/collection/shows`);
  return response.data;
}

export async function getShowSummary(
  showId: number | string,
): Promise<Trakt.Show> {
  const response = await axiosNoAuth.get(`/shows/${showId}?extended=full`);
  response.data.type = "show";
  return response.data;
}

export async function getMovieSummary(movieId: string) {
  const response = await axiosNoAuth.get(`/movies/${movieId}?extended=full`);
  response.data.type = "movie";
  return response.data;
}

export async function getEpisodeSummary(
  showId: string,
  season: number,
  episode: number,
): Promise<Trakt.Episode> {
  const response = await axiosNoAuth.get(
    `/shows/${showId}/seasons/${season}/episodes/${episode}?extended=full`,
  );
  response.data.type = "episode";
  return response.data;
}

export async function getSeasonSummary(slug: string, season: number) {
  const response = await axiosNoAuth.get(
    `/shows/${slug}/seasons?extended=full`,
  );
  return response.data.find((item: Trakt.Episode) => item.number === season);
}

export async function getEpisodeRating(
  showId: string,
  season: number,
  episode: number,
) {
  const response = await axiosNoAuth.get(
    `/shows/${showId}/seasons/${season}/episodes/${episode}/ratings`,
  );
  return response.data.rating.toFixed(1);
}

export async function getShowRating(showId: string) {
  const response = await axiosNoAuth.get(`/shows/${showId}/ratings`);
  return response.data.rating.toFixed(1);
}

export async function getMovieRating(movieId: string) {
  const response = await axiosNoAuth.get(`/movies/${movieId}/ratings`);
  return response.data.rating.toFixed(1);
}

export async function getShowActors(showId: number) {
  const response = await axios({
    method: "GET",
    url: `https://api.trakt.tv/shows/${showId}/people`,
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  return response.data;
}

export async function getMyEpisodeRatings(page?: number) {
  const uName: string = JSON.parse(localStorage.getItem("trakt-vue-user")!)
    ?.user.username;
  const url = page
    ? `https://api.trakt.tv/users/${uName}/ratings/episodes?limit=10&page=${page}`
    : `https://api.trakt.tv/users/${uName}/ratings/episodes`;
  const response = await axios({
    method: "GET",
    url,
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  const ratings: Trakt.Ratings = {
    lastModified: response.headers["last-modified"]!,
    total: response.headers["x-pagination-item-count"]
      ? response.headers["x-pagination-item-count"]
      : response.data.length,
    ratings: response.data,
  };
  return ratings;
}

export async function getMySeasonRatings(page?: number) {
  const uName = JSON.parse(localStorage.getItem("trakt-vue-user")!)?.user
    .username;
  const url = page
    ? `https://api.trakt.tv/users/${uName}/ratings/seasons?limit=10&page=${page}`
    : `https://api.trakt.tv/users/${uName}/ratings/seasons`;
  const response = await axios({
    method: "GET",
    url,
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  const ratings: Trakt.Ratings = {
    lastModified: response.headers["last-modified"]!,
    total: response.headers["x-pagination-item-count"]
      ? response.headers["x-pagination-item-count"]
      : response.data.length,
    ratings: response.data,
  };
  return ratings;
}

export async function getMyShowRatings(page?: number) {
  const uName: string = JSON.parse(localStorage.getItem("trakt-vue-user")!)
    ?.user.username;
  const url: string = page
    ? `https://api.trakt.tv/users/${uName}/ratings/shows?limit=10&page=${page}`
    : `https://api.trakt.tv/users/${uName}/ratings/shows`;
  const response = await axios({
    method: "GET",
    url,
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  const ratings: Trakt.Ratings = {
    lastModified: response.headers["last-modified"]!,
    total: response.headers["x-pagination-item-count"]
      ? response.headers["x-pagination-item-count"]
      : response.data.length,
    ratings: response.data,
  };
  return ratings;
}

export async function getMyMovieRatings(page?: number) {
  const uName: string = JSON.parse(localStorage.getItem("trakt-vue-user")!)
    ?.user.username;
  const url = page
    ? `https://api.trakt.tv/users/${uName}/ratings/movies?limit=10&page=${page}`
    : `https://api.trakt.tv/users/${uName}/ratings/movies`;
  const response = await axios({
    method: "GET",
    url,
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  const ratings: Trakt.Ratings = {
    lastModified: response.headers["last-modified"]!,
    total: response.headers["x-pagination-item-count"]
      ? response.headers["x-pagination-item-count"]
      : response.data.length,
    ratings: response.data,
  };
  return ratings;
}

export async function getMyLikes(page?: number) {
  const uName: string = JSON.parse(localStorage.getItem("trakt-vue-user")!)
    ?.user.username;
  const url = `https://api.trakt.tv/users/${uName}/likes/comments?limit=10&page=${page}`;
  const response = await axios({
    method: "GET",
    url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JSON.parse(localStorage.getItem("trakt-vue-token")!).access_token}`,
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  const likes: Trakt.Like[] = response.data;
  return likes;
}

export async function getComments(
  item: any,
  reply = false,
): Promise<Trakt.Comments> {
  let url;

  if (reply) {
    url = `https://api.trakt.tv/comments/${item}/replies`;
  } else if (item.type === "episode") {
    const episode = item as Trakt.Episode;
    url = `https://api.trakt.tv/shows/${episode.slug}/seasons/${episode.season}/episodes/${episode.number}/comments/likes`;
  } else if (item.type === "season") {
    const season = item as Trakt.Season;
    url = `https://api.trakt.tv/shows/${season.ids.slug}/seasons/${season.number}/comments/likes`;
  } else if (item.type === "show") {
    const show = item as Trakt.Show;
    url = `https://api.trakt.tv/shows/${show.ids.trakt}/comments/likes`;
  } else {
    url = `https://api.trakt.tv/movies/${item.ids.trakt}/comments/likes`;
  }

  const response = await axios({
    method: "GET",
    url,
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  const returnVal = await Promise.all(
    response.data.map(async (comment: Trakt.Comment) => {
      try {
        const info = await axios({
          method: "GET",
          url: `https://api.trakt.tv/users/${comment.user.ids.slug}?extended=full`,
          headers: {
            "Content-Type": "application/json",
            "trakt-api-version": "2",
            "trakt-api-key":
              "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
          },
        });
        const defaultAvatar =
          info.data.gender === "female"
            ? "https://i2.wp.com/walter.trakt.tv/hotlink-ok/placeholders/medium/leela.png"
            : "https://i2.wp.com/walter.trakt.tv/hotlink-ok/placeholders/medium/fry.png";
        return {
          ...comment,
          ...{
            avatar: info.data.images
              ? info.data.images?.avatar.full
              : defaultAvatar,
          },
        };
      } catch {
        return {
          ...comment,
          ...{
            avatar:
              "https://i2.wp.com/walter.trakt.tv/hotlink-ok/placeholders/medium/fry.png",
          },
        };
      }
    }),
  );
  return {
    total: response.headers["x-pagination-item-count"],
    comments: returnVal,
  };
}

export async function getShowWatchedProgress(
  showId: string,
): Promise<Trakt.WatchedProgress | null> {
  let token: string = "";

  if (JSON.parse(localStorage.getItem("trakt-vue-token")!)) {
    token = JSON.parse(localStorage.getItem("trakt-vue-token")!).access_token;
  }

  if (token) {
    const response = await axios({
      method: "GET",
      url: `https://api.trakt.tv/shows/${showId}/progress/watched?hidden=false&specials=false&count_specials=false`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "trakt-api-version": "2",
        "trakt-api-key":
          "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
      },
    });
    return { ...response.data, ...{ type: "show" } };
  }
  return null;
}

export async function getMyWatchedMovies() {
  const response = await axios({
    method: "GET",
    url: "https://api.trakt.tv/sync/watched/movies",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JSON.parse(localStorage.getItem("trakt-vue-token")!).access_token}`,
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  return response.data;
}

export async function getIdLookupTmdb(
  id: number,
  mType: string | null = null,
): Promise<Trakt.Ids | false> {
  const mediaType = mType === "tv" ? "show" : mType;
  const response = await axios({
    method: "GET",
    url: `https://api.trakt.tv/search/tmdb/${id}${mType !== null ? `?type=${mediaType}` : ""}`,
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  return response.data.length > 0
    ? response.data[0][response.data[0].type].ids
    : false;
}

export async function getIdLookupTrakt(id: string, mType = null) {
  const response = await axios({
    method: "GET",
    url: `https://api.trakt.tv/search/trakt/${id}${mType ? `?type=${mType}` : null}`,
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  return response.data[0];
}

export async function getIdLookupActorTmdb(id: number) {
  const response = await axios({
    method: "GET",
    url: `https://api.trakt.tv/search/tmdb/${id}?type=person`,
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  return response.data[0];
}

export async function searchAutocomplete(keyword: string) {
  const response = await axios({
    method: "GET",
    url: `https://api.trakt.tv/search/movie,show?query=${keyword}`,
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  return response.data;
}
// -------- </GET> -----------

// -------- <POST> -----------
export async function rateShow(show: Trakt.Show, rating: number) {
  const response = await axios({
    method: "POST",
    url: `https://api.trakt.tv/sync/ratings${rating === 0 ? "/remove" : ""}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JSON.parse(localStorage.getItem("trakt-vue-token")!).access_token}`,
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
    data: {
      shows: [
        {
          rating,
          ids: show.ids,
        },
      ],
    },
  });
  return response.status === 201 || response.status === 200;
}

export async function rateSeason(season: Trakt.Season, rating: number) {
  let token: string = "";
  if (localStorage.getItem("trakt-vue-token")) {
    token = JSON.parse(localStorage.getItem("trakt-vue-token")!).access_token;
  }
  const response = await axios({
    method: "POST",
    url: `https://api.trakt.tv/sync/ratings${rating === 0 ? "/remove" : ""}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
    data: {
      seasons: [
        {
          rating,
          ids: season.ids,
        },
      ],
    },
  });
  return response.status === 201 || response.status === 200;
}

export async function rateEpisode(episode: Trakt.Episode, rating: number) {
  let token: string = "";
  if (localStorage.getItem("trakt-vue-token")) {
    token = JSON.parse(localStorage.getItem("trakt-vue-token")!).access_token;
  }
  const response = await axios({
    method: "POST",
    url: `https://api.trakt.tv/sync/ratings${rating === 0 ? "/remove" : ""}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
    data: {
      episodes: [
        {
          rating,
          ids: episode.ids,
        },
      ],
    },
  });
  const success = response.status === 201 || response.status === 200;
  // if (success) {
  //   const ratings = JSON.parse(localStorage.getItem('trakt-vue-episode-ratings'));
  //   ratings.ratings.push({ rating, show: episode.show, episode: episode.ids });
  // }
  return success;
}

export async function rateMovie(movie: Trakt.Movie, rating: number) {
  let token: string = "";
  if (localStorage.getItem("trakt-vue-token")) {
    token = JSON.parse(localStorage.getItem("trakt-vue-token")!).access_token;
  }
  const response = await axios({
    method: "POST",
    url: `https://api.trakt.tv/sync/ratings${rating === 0 ? "/remove" : ""}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
    data: {
      movies: [
        {
          rating,
          ids: movie.ids,
        },
      ],
    },
  });
  const success = response.status === 201 || response.status === 200;
  // if (success) {
  //   const ratings = JSON.parse(localStorage.getItem('trakt-vue-movie-ratings'));
  //   ratings.ratings.push({ rating, movie });
  // }
  return success;
}

export async function likeComment(id: number, deleteComment = false) {
  let token: string = "";
  if (localStorage.getItem("trakt-vue-token")) {
    token = JSON.parse(localStorage.getItem("trakt-vue-token")!).access_token;
  }
  const response = await axios({
    method: deleteComment ? "DELETE" : "POST",
    url: `https://api.trakt.tv/comments/${id}/like`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "trakt-api-version": "2",
      "trakt-api-key":
        "8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3",
    },
  });
  return response.status === 204;
}
// -------- </POST> -----------
