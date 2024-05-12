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
  if (!store.genres) store.updateGenres(await getGenres());

  const checkToken = async () => {
    if (localStorage.getItem("trakt-vue-token")) {
      // if local storage has tokens, get the accessToken from the refreshToken

      let myShowRatings: Trakt.Ratings;
      let mySeasonRatings: Trakt.Ratings;
      let myEpRatings: Trakt.Ratings;
      let myMovieRatings: Trakt.Ratings;
      let myLikes: Trakt.Like[] = [];
      let myWatchedMovies = [];

      const getRatings = (
        item: string,
        initialCallRatings: Trakt.Ratings,
        ratingFunction: () => Promise<Trakt.Ratings>,
      ) => {
        // get show ratings
        const storedRatings: Trakt.Ratings = JSON.parse(
          localStorage.getItem(`trakt-vue-${item}-ratings`)!,
        );
        if (!storedRatings) {
          // set to localStorage here to eliminate delay
          localStorage.setItem(
            `trakt-vue-${item}-ratings`,
            JSON.stringify(initialCallRatings),
          );
        }
        if (
          initialCallRatings.total > initialCallRatings.ratings.length ||
          storedRatings?.lastModified !== initialCallRatings.lastModified
        ) {
          // only get the big rating object if new ratings have been added
          ratingFunction().then((remainingRatings: Trakt.Ratings) => {
            localStorage.setItem(
              `trakt-vue-${item}-ratings`,
              JSON.stringify(remainingRatings),
            );
          });
        }
      };

      // MOVE RATINGS STUFF TO MOVIE AND TV PAGES

      if (to.path.split("/")[1] === "movie") {
        [myMovieRatings, myLikes, myWatchedMovies] = await Promise.all([
          getMyMovieRatings(1),
          getMyLikes(1),
          getMyWatchedMovies(),
        ]);
        getRatings("movie", myMovieRatings, getMyMovieRatings);
        // set watched movies
        localStorage.setItem(
          "trakt-vue-watched-movies",
          JSON.stringify(myWatchedMovies),
        );
      } else {
        [myShowRatings, mySeasonRatings, myEpRatings, myLikes] =
          await Promise.all([
            getMyShowRatings(1),
            getMySeasonRatings(1),
            getMyEpisodeRatings(1),
            getMyLikes(1),
          ]);
        getRatings("show", myShowRatings, getMyShowRatings);
        getRatings("season", mySeasonRatings, getMySeasonRatings);
        getRatings("episode", myEpRatings, getMyEpisodeRatings);
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
  };

  // await checkToken();

  // if (to.query?.code) {
  //   // if no tokens were present and we fell into the else, we get redirected
  //   // with query: code and put tokens into local storage
  //   if (!localStorage.getItem("trakt-vue-token")) {
  //     const authTokens = await getToken(to.query.code! as string);
  //     if (authTokens) {
  //       localStorage.setItem("trakt-vue-token", JSON.stringify(authTokens));
  //       store.updateTokens(authTokens);
  //       await checkToken();
  //     }
  //   }
  //   next({ path: "/tv/trending" });
  // }

  // remove trailing slash
  const path = to.path.replace(/\/+$/, "");
  if (path === "" || path === "/tv") next("/tv/trending");
  else next();
});

router.afterEach(() => {
  const store = useStore();
  store.updateLoading(false);
  // console.log(router.replace({ query: null }))
  // console.log(router.currentRoute.value.query.code)
});

export default router;
