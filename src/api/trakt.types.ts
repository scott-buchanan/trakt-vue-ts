import type { MediaType } from "~/types/types";

export namespace Trakt {
  // settings
  export interface MyInfo {
    account: {
      cover_image: string;
    };
    user: User;
  }

  export interface User {
    name: string;
    username: string;
    images: {
      avatar: {
        full: string;
      };
    };
  }

  export interface Ids {
    trakt: string;
    slug: string;
    tmdb: number;
    imdb: string;
    tvdb: number;
  }

  export interface AuthTokens {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    created_at: number;
  }

  export interface Like {
    liked_at: string;
    comment: { id: number };
    type: string;
  }

  interface Rating {
    rated_at: string;
    rating: number;
    type: MediaType;
  }

  export interface ShowRating extends Rating {
    show: Show;
  }

  export interface EpisodeRating extends Rating {
    episode: Episode;
  }

  export interface SeasonRating extends Rating {
    season: Season;
  }

  export interface MovieRating extends Rating {
    movie: Movie;
  }

  export interface Ratings {
    total: number;
    lastModified: string;
    type: string;
    ratings: ShowRating[] | EpisodeRating[] | SeasonRating[] | MovieRating[];
  }

  export interface Comments {
    total: number;
    comments: Comment[];
  }

  export interface Comment {
    created_at: string;
    comment: string;
    spoiler: boolean;
    review: boolean;
    replies: number;
    likes: number;
    user_stats: {
      rating: number;
    };
    user_rating: number;
    user: {
      username: string;
      name: string;
      ids: {
        slug: string;
      };
    };
  }

  export interface Episode {
    ids?: Ids;
    title?: string;
    season: number;
    number: number;
    year?: number;
    slug?: string;
    type?: string;
  }

  export interface Season {
    ids: Ids;
    number: number;
    slug: string;
    type: string;
  }

  export interface Show {
    ids: Ids;
    title: string;
    year: number;
    runtime: number;
    slug: string;
    type: string;
  }

  export interface Movie {
    ids: Ids;
    title: string;
    year: number;
    slug: string;
    type: string;
  }

  export interface WatchedProgress {
    aired: number;
    completed: number;
    last_watched_at: string;
    seasons?: {
      aired: number;
      completed: number;
      episodes: {
        completed: boolean;
        last_watched_at: string;
        number: number;
      }[];
      number: number;
    }[];
    type: MediaType;
    plays: number;
  }

  export interface WatchedMovie {
    movie: Trakt.Movie;
    plays: number;
  }
}

export default Trakt;
