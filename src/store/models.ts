import type Trakt from "~/api/trakt.types";
import Tmdb from "~/api/tmdb.types";

export interface Filter {
  label: string;
  val: string;
  auth: boolean;
}

export interface FilterOptions {
  show: Filter[];
  movie: Filter[];
}

export type FilterType = "show" | "movie";

export interface StateObj {
  page: number;
  filter: Filter;
  filterOptions: FilterOptions;
  filterType: FilterType;
  loaded: boolean;
  tokens: object | null;
  myInfo: Trakt.MyInfo | null;
  menuVisible: boolean;
  currentIds: Trakt.Ids | null;
  genres: Tmdb.Genres;
  tmdbConfig: Tmdb.TmdbConfig | null;
  searchPage: number | null;
}
