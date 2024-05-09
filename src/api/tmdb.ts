import axios from "axios";
import dayjs from "dayjs";
// api
import { getMovieBackground, getTvBackground } from "./fanart";
import { getIdLookupActorTmdb, getIdLookupTmdb } from "./trakt";
// types
import type Tmdb from "./tmdb.types";
import type Trakt from "~/api/trakt.types";
import { MediaType } from "~/types/types";
// assets
import * as fallback from "~/assets/fallback-tv.jpg";

export async function getImageUrls(): Promise<Tmdb.TmdbConfig> {
  const response = await axios({
    method: "GET",
    url: "https://api.themoviedb.org/3/configuration?api_key=89c6bd3331244e97eed61741fc798ab5",
  });
  return response.data;
}

export async function getAppBackgroundImg(
  tmdbConfig: Tmdb.TmdbConfig,
): Promise<{
  id: number;
  title: string;
  backgroundUrl: string;
  type: string;
  year: string;
  posterUrl: string;
}> {
  const response = await axios({
    method: "GET",
    url: "https://api.themoviedb.org/3/trending/all/day?api_key=89c6bd3331244e97eed61741fc798ab5",
  });
  const rando = Math.floor(Math.random() * response.data.results.length);
  const imgObj = response.data.results[rando];
  console.log(tmdbConfig);
  return {
    id: imgObj.id,
    title: imgObj.title ? imgObj.title : imgObj.name,
    type: imgObj.media_type,
    year: dayjs(imgObj.release_date).format("YYYY"),
    posterUrl: `${tmdbConfig.images.secure_base_url}${tmdbConfig.images.poster_sizes[3]}${imgObj.poster_path}`,
    backgroundUrl: `${tmdbConfig.images.secure_base_url}${tmdbConfig.images.backdrop_sizes[3]}${imgObj.backdrop_path}`,
  };
}

export async function getShowPoster(show: Trakt.Show) {
  const response = await axios({
    method: "GET",
    url: `https://api.themoviedb.org/3/tv/${show.ids.tmdb}/images?language=en&api_key=89c6bd3331244e97eed61741fc798ab5`,
  });

  if (response.data.posters.length > 0)
    return `https://image.tmdb.org/t/p/w780/${response.data.posters[0].file_path}`;

  // Sometimes the details call has a poster where the images call does not. Weird.
  const details = await axios({
    method: "GET",
    url: `https://api.themoviedb.org/3/tv/${show.ids.tmdb}?language=en&api_key=89c6bd3331244e97eed61741fc798ab5`,
  });
  return details.data.poster_path
    ? `https://image.tmdb.org/t/p/w780/${details.data.poster_path}`
    : fallback.default;
}

export async function getSeasonPoster(show: Trakt.Show, seasonNumber: number) {
  try {
    const response = await axios({
      method: "GET",
      url: `https://api.themoviedb.org/3/tv/${show.ids.tmdb}/season/${seasonNumber}/images?language=en&api_key=89c6bd3331244e97eed61741fc798ab5`,
    });
    return `https://image.tmdb.org/t/p/w780/${response.data.posters[0].file_path}`;
  } catch {
    return getShowPoster(show);
  }
}

export async function getMoviePoster(movie: Trakt.Movie) {
  const response = await axios({
    method: "GET",
    url: `https://api.themoviedb.org/3/movie/${movie.ids.tmdb}/images?language=en&api_key=89c6bd3331244e97eed61741fc798ab5`,
  });

  if (response.data.posters.length > 0)
    return `https://image.tmdb.org/t/p/w780/${response.data.posters[0].file_path}`;

  // Sometimes the details call has a poster where the images call does not. Weird.
  const details = await axios({
    method: "GET",
    url: `https://api.themoviedb.org/3/movie/${movie.ids.tmdb}?language=en&api_key=89c6bd3331244e97eed61741fc798ab5`,
  });
  return details.data.poster_path
    ? `https://image.tmdb.org/t/p/w780/${details.data.poster_path}`
    : fallback.default;
}

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {Object} show - Show object.
 * @returns {String} image url.
 */
export async function getShowBackdrop(show: Trakt.Show) {
  try {
    const response = await axios({
      method: "GET",
      url: `https://api.themoviedb.org/3/tv/${show.ids.tmdb}/images?api_key=89c6bd3331244e97eed61741fc798ab5&include_image_language=null`,
    });
    if (response.data.backdrops.length < 1) {
      const fanartBackground = await getTvBackground(show.ids.tvdb);
      if (!fanartBackground) throw new Error("no images found");
      return {
        backdrop_sm: fanartBackground,
        backdrop_lg: fanartBackground,
      };
    }
    interface backdrop {
      vote_average: number;
      height: number;
    }
    response.data.backdrops.sort(
      (a: backdrop, b: backdrop) =>
        b.vote_average - a.vote_average || b.height - a.height,
    );
    return {
      backdrop_sm: `https://image.tmdb.org/t/p/w780${response.data.backdrops[0].file_path}`,
      backdrop_lg: `https://image.tmdb.org/t/p/w1280${response.data.backdrops[0].file_path}`,
    };
  } catch {
    return { backdrop_sm: fallback.default, backdrop_lg: fallback.default };
  }
}

export async function getEpisodeBackdrop(
  show: Trakt.Show,
  episode: Trakt.Episode,
) {
  try {
    const response = await axios({
      method: "GET",
      url: `https://api.themoviedb.org/3/tv/${show.ids.tmdb}/season/${episode.season}/episode/${episode.number}/images?api_key=89c6bd3331244e97eed61741fc798ab5&include_image_language=null`,
    });
    if (response.data.stills.length < 1) return await getShowBackdrop(show);

    return {
      backdrop_sm: `https://image.tmdb.org/t/p/w780${response.data.stills[0].file_path}`,
      backdrop_lg: `https://image.tmdb.org/t/p/w1280${response.data.stills[0].file_path}`,
    };
  } catch {
    return getShowBackdrop(show);
  }
}

/**
 * Gets the info needed to display episode info in the CardContainer component.
 * @function
 * @param {Object} movie - Movie object.
 * @returns {String} image url.
 */
export async function getMovieBackdrop(movie: Trakt.Movie) {
  try {
    const response = await axios({
      method: "GET",
      url: `https://api.themoviedb.org/3/movie/${movie.ids.tmdb}/images?api_key=89c6bd3331244e97eed61741fc798ab5&include_image_language=null`,
    });
    if (response.data.backdrops.length < 1) {
      const fanartBackground = await getMovieBackground(movie.ids.tvdb);
      return {
        backdrop_sm: fanartBackground,
        backdrop_lg: fanartBackground,
      };
    }
    return {
      backdrop_sm: `https://image.tmdb.org/t/p/w780${response.data.backdrops[0].file_path}`,
      backdrop_lg: `https://image.tmdb.org/t/p/w1280${response.data.backdrops[0].file_path}`,
    };
  } catch {
    return { backdrop_sm: fallback.default, backdrop_lg: fallback.default };
  }
}

export async function tmdbEpisodeDetails(
  show: Trakt.Show,
  episode: Trakt.Episode,
) {
  try {
    const response = await axios({
      method: "GET",
      url: `https://api.themoviedb.org/3/tv/${show.ids.tmdb}/season/${episode.season}/episode/${episode.number}?api_key=89c6bd3331244e97eed61741fc798ab5`,
    });
    return response.data;
  } catch {
    return null;
  }
}

export async function tmdbShowDetails(show: Trakt.Show) {
  try {
    const response = await axios({
      method: "GET",
      url: `https://api.themoviedb.org/3/tv/${show.ids.tmdb}?api_key=89c6bd3331244e97eed61741fc798ab5&append_to_response=videos`,
    });
    const { data } = response;
    const seasons: Tmdb.Season[] = [];
    await Promise.all(
      data.seasons.map(async (season: Tmdb.Season) => {
        if (season.episode_count > 0) {
          let path;
          if (!season.poster_path) path = await getShowPoster(show);
          else path = `https://image.tmdb.org/t/p/w200${season.poster_path}`;

          seasons.push({ ...season, ...{ poster_path: path } });
        }
      }),
    );
    data.seasons = seasons;
    data.seasons.sort(
      (a: Tmdb.Season, b: Tmdb.Season) => a.season_number - b.season_number,
    );

    if (data.seasons[0].name.toLowerCase() === "specials") {
      const specials = data.seasons.shift();
      data.seasons.push(specials);
    }

    data.videos = data.videos.results.filter(
      (v: Tmdb.Video) =>
        v.type.toLowerCase() === "trailer" || v.type.toLowerCase() === "teaser",
    );

    return data;
  } catch {
    return null;
  }
}

export async function tmdbShowSeasonDetails(show: Trakt.Show, season: number) {
  try {
    const response = await axios({
      method: "GET",
      url: `https://api.themoviedb.org/3/tv/${show.ids.tmdb}/season/${season}?api_key=89c6bd3331244e97eed61741fc798ab5`,
    });
    const episodes: Tmdb.EpisodeDetails[] = [];
    await Promise.all(
      response.data.episodes.map(async (episode: Tmdb.EpisodeDetails) => {
        const ep: Trakt.Episode = {
          season: episode.season_number,
          number: episode.episode_number,
        };
        const backdrop = await getEpisodeBackdrop(show, ep);
        episodes.push({ ...episode, ...{ backdrop } });
      }),
    );

    episodes.sort((a, b) => a.episode_number - b.episode_number);

    return { ...response.data, ...{ episodes } };
  } catch {
    return null;
  }
}

export async function tmdbMovieDetails(movie: Trakt.Movie) {
  try {
    const response = await axios({
      method: "GET",
      url: `https://api.themoviedb.org/3/movie/${movie.ids.tmdb}?api_key=89c6bd3331244e97eed61741fc798ab5&append_to_response=videos`,
    });
    response.data.videos = response.data.videos.results.filter(
      (v: Tmdb.Video) =>
        v.type.toLowerCase() === "trailer" || v.type.toLowerCase() === "teaser",
    );
    return response.data;
  } catch {
    return null;
  }
}

export async function tmdbEpisodeActors(
  show: Trakt.Show,
  episode: Trakt.Episode,
) {
  try {
    const response = await axios({
      method: "GET",
      url: `https://api.themoviedb.org/3/tv/${show.ids.tmdb}/season/${episode.season}/episode/${episode.number}/credits?api_key=89c6bd3331244e97eed61741fc798ab5`,
    });
    const data = response.data.cast;
    const actors: Tmdb.Actor[] = [];
    await Promise.all(
      data.map(async (item: Tmdb.Actor) => {
        const actorIds = await getIdLookupActorTmdb(item.id);
        const path = `https://image.tmdb.org/t/p/w200${item.profile_path}`;
        actors.push({
          ...item,
          ...{ profile_path: path },
          ids: actorIds.person.ids,
        });
      }),
    );
    return actors.sort((a, b) => a.order - b.order);
  } catch (error) {
    return [];
  }
}

export async function tmdbActors(
  item: Trakt.Show | Trakt.Movie,
): Promise<Tmdb.Actor[]> {
  const mType: MediaType | string =
    item.type === MediaType.movie ? MediaType.movie : "tv";
  const response = await axios({
    method: "GET",
    url: `https://api.themoviedb.org/3/${mType}/${item.ids.tmdb}/credits?api_key=89c6bd3331244e97eed61741fc798ab5`,
  });
  const data = response.data.cast;
  const actors: Tmdb.Actor[] = [];
  await Promise.all(
    data.map(async (actor: Tmdb.Actor) => {
      const actorIds = await getIdLookupActorTmdb(actor.id);
      const path = `https://image.tmdb.org/t/p/w200${actor.profile_path}`;
      actors.push({
        ...actor,
        ...{ profile_path: actor.profile_path ? path : null },
        ids: actorIds.person.ids,
      });
    }),
  );
  return actors.sort((a, b) => a.order - b.order);
}

export async function getActorImage(tmdbId: string) {
  const response = await axios({
    method: "GET",
    url: `https://api.themoviedb.org/3/person/${tmdbId}/images?api_key=89c6bd3331244e97eed61741fc798ab5`,
  });
  return response.data;
}

export async function rateEpisode(
  showId: number,
  season: number,
  episode: number,
  rating: number,
) {
  const response = await axios({
    method: "POST",
    url: `https://api.themoviedb.org/3/tv/${showId}/season/${season}/episode/${episode}/rating?api_key=89c6bd3331244e97eed61741fc798ab5`,
    data: {
      value: rating,
    },
  });
  return response.status === 201;
}

export async function getShowVideos(showId: number) {
  const response = await axios({
    method: "GET",
    url: `https://api.themoviedb.org/3/tv/${showId}/videos?api_key=89c6bd3331244e97eed61741fc798ab5`,
  });
  return response.data.results;
}

export async function getGenres(): Promise<Tmdb.Genres> {
  const response = await Promise.all([
    axios({
      method: "GET",
      url: "https://api.themoviedb.org/3/genre/tv/list?api_key=89c6bd3331244e97eed61741fc798ab5&language=en",
    }),
    axios({
      method: "GET",
      url: "https://api.themoviedb.org/3/genre/movie/list?api_key=89c6bd3331244e97eed61741fc798ab5&language=en",
    }),
  ]);
  return {
    tv: response[0].data.genres,
    movie: response[1].data.genres,
  };
}

export async function getSearchResults(keyword: string, page = 1) {
  const response = await axios.get(
    `https://api.themoviedb.org/3/search/multi?&query=${keyword}&include_adult=true&language=en-US&page=${page}&api_key=89c6bd3331244e97eed61741fc798ab5`,
  );
  const modified = await Promise.all(
    response.data.results.map(async (item: any) => {
      const ids = await getIdLookupTmdb(item.id, item.media_type);
      if (ids && "trakt" in ids) {
        item.ids = ids;
      }
      return item;
    }),
  );
  return modified.filter((r) => r).sort((a, b) => b.popularity - a.popularity);
}

export async function getMovieCollection(collectionId: number) {
  const response = await axios({
    method: "GET",
    url: `https://api.themoviedb.org/3/collection/${collectionId}?api_key=89c6bd3331244e97eed61741fc798ab5`,
  });
  response.data.parts = response.data.parts
    .filter((c: Tmdb.MovieDetails) => c.release_date !== "")
    .sort((a: Tmdb.Collection, b: Tmdb.Collection) => (a.id < b.id ? 1 : -1));
  return response.data;
}
