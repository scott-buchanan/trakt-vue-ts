import { createRouter, createWebHistory } from "vue-router";
import routes from "./routes";
import { useStore } from "~/store/index";
import {
  getMyEpisodeRatings,
  getMyLikes,
  getMyMovieRatings,
  getMySeasonRatings,
  getMyShowRatings,
  getMyWatchedMovies,
} from "~/api/trakt";

import type Trakt from "~/api/trakt.types";
import { getGenres } from "~/api/tmdb";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const store = useStore();

  // get tmdb genres and store in state
  if (store.genres.tv.length === 0 || store.genres.movie.length === 0)
    store.updateGenres(await getGenres());

  if (localStorage.getItem("trakt-vue-token")) {
    // if local storage has tokens, get the accessToken from the refreshToken

    let myShowRatings: Trakt.Ratings;
    let mySeasonRatings: Trakt.Ratings;
    let myEpRatings: Trakt.Ratings;
    let myMovieRatings: Trakt.Ratings;
    let myLikes: Trakt.Like[] = [];
    let myWatchedMovies = [];

    if (to.path.split("/")[1] === "movies") {
      [myMovieRatings, myLikes, myWatchedMovies] = await Promise.all([
        getMyMovieRatings(true),
        getMyLikes(1),
        getMyWatchedMovies(),
      ]);
      store.updateRatings("movie", myMovieRatings);
    } else {
      // tv section route
      [myShowRatings, mySeasonRatings, myEpRatings, myLikes] =
        await Promise.all([
          getMyShowRatings(true),
          getMySeasonRatings(true),
          getMyEpisodeRatings(true),
          getMyLikes(1),
        ]);

      for (const ratings of [myShowRatings, mySeasonRatings, myEpRatings]) {
        // get localStorage ratings
        const localStorageStr = localStorage.getItem(
          `trakt-vue-${ratings.type}-ratings`,
        );

        // if no localStorage or if API return modified date doesn't match localStorage modified date
        if (
          !localStorageStr ||
          ratings.lastModified !== JSON.parse(localStorageStr).lastModified
        ) {
          switch (ratings.type) {
            case "show":
              myShowRatings = await getMyShowRatings();
              localStorage.setItem(
                `trakt-vue-${ratings.type}-ratings`,
                JSON.stringify(myShowRatings),
              );
              break;
            case "season":
              mySeasonRatings = await getMySeasonRatings();
              localStorage.setItem(
                `trakt-vue-${ratings.type}-ratings`,
                JSON.stringify(mySeasonRatings),
              );
              break;
            case "episode":
              myEpRatings = await getMyEpisodeRatings();
              localStorage.setItem(
                `trakt-vue-${ratings.type}-ratings`,
                JSON.stringify(myEpRatings),
              );
          }
        }
      }

      // update the store with new ratings
      store.updateRatings("show", myShowRatings);
      store.updateRatings("season", mySeasonRatings);
      store.updateRatings("episode", myEpRatings);
    }

    const storedLikes: Trakt.Like[] =
      localStorage.getItem("trakt-vue-likes") !== "undefined"
        ? JSON.parse(localStorage.getItem("trakt-vue-likes")!)
        : null;
    // set to localStorage here to eliminate delay
    localStorage.setItem("trakt-vue-likes", JSON.stringify(myLikes));
    // need to add this check because this call needs token
    if (storedLikes && storedLikes[0] !== myLikes[0]) {
      if (storedLikes.length > 99) {
        getMyLikes().then((remainingLikes) => {
          const total = { ...myLikes, ...remainingLikes };
          localStorage.setItem("trakt-vue-likes", JSON.stringify(total));
        });
      } else {
        localStorage.setItem("trakt-vue-likes", JSON.stringify(myLikes));
      }
    }
  }

  next();
});

export default router;
