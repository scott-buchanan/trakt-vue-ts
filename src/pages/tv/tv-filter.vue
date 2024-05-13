<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Ref } from "vue";
import { useQuasar } from "quasar";
import { useRoute, useRouter } from "vue-router";
// api
import {
  getAnticipated,
  getCommunityRecommended,
  getRecommendationsFromMe,
  getTrending,
  getWatchedHistory,
} from "~/api/trakt";
import { getEpisodeInfoCard, getShowInfoCard } from "~/api/combinedCalls";

// store
import { useStore } from "~/store/index";

// components
import CardContainer from "~/components/CardContainer.vue";

import type Trakt from "~/api/trakt.types";
import type { Filter } from "~/store/models";
import { CardInfo } from "~/api/combinedCall.types";

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const store = useStore();

interface Data {
  items: Trakt.Show[] | Trakt.Episode[];
  page: number;
  pagesTotal: number;
}

// data
const data: Ref<Data | null> = ref(null);
const filter: Ref<Filter> = ref(store.filter);
const maxPages: Ref<number> = ref(10);
const myEpRatings: Ref<Trakt.Ratings | null> = ref(null);
const page: Ref<number> = ref(store.page);

const myShowRatings: Ref<Trakt.Ratings> = ref({} as Trakt.Ratings);
const tokens: Ref<Trakt.AuthTokens> = ref(store.tokens);

store.$subscribe((mutated, state) => {
  let triggerLoad = false;
  if (
    state.filterType === "show" &&
    state.filter &&
    state.filter.val !== filter.value.val
  )
    triggerLoad = true;

  filter.value = state.filter;
  tokens.value = state.tokens;
  page.value = state.page;

  if (triggerLoad) loadData();
});

async function loadData() {
  store.updateLoading(false);

  // this makes it so the card container always has a full last line
  localStorage.setItem("item-limit", "30");

  // if watched history
  if (store.filterType === "show" && filter.value?.val === "history") {
    // get Trakt data
    data.value = await getWatchedHistory("episodes", page.value);

    // get episode ratings object from local storage
    myEpRatings.value = JSON.parse(
      localStorage.getItem("trakt-vue-episode-ratings")!,
    );

    // get images and ratings
    const items = await fetchCardInfo("episode", myEpRatings.value!);

    // sort by watched date (no logic here because only one filter)
    items.sort(
      (a: CardInfo, b: CardInfo) =>
        new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime(),
    );

    data.value.items = [...items];
  } else {
    switch (filter.value?.val) {
      case "anticipated":
        data.value = await getAnticipated("shows", page.value);
        break;
      case "trakt_recommended":
        data.value = await getCommunityRecommended("shows", page.value);
        break;
      case "recommended":
        data.value = await getRecommendationsFromMe("shows", page.value);
        break;
      case "trending":
        data.value = await getTrending("shows", page.value);
        break;
      default:
        store.updateLoading(true);
        return;
    }

    // get show ratings object from local storage
    myShowRatings.value = JSON.parse(
      localStorage.getItem("trakt-vue-show-ratings")!,
    );
    // get images and ratings
    const items = await fetchCardInfo("show", myShowRatings.value);
    if (filter.value.val === "recommended")
      items.sort((a, b) => a.rank - b.rank);
    else if (filter.value.val === "trending")
      items.sort((a, b) => b.watchers - a.watchers);

    data.value.items = [...items];
  }
  store.updateLoading(true);
}

async function fetchCardInfo(mType: string, ratingsObj: Trakt.Ratings) {
  const items = [];
  await Promise.all(
    data.value.items.map(async (item) => {
      const cardInfo =
        mType === "show"
          ? await getShowInfoCard(item.show)
          : await getEpisodeInfoCard(item.show, item.episode);
      const myRating = { my_rating: null };
      myRating.my_rating = ratingsObj?.ratings.find((rating) => {
        if (mType === "show")
          return (
            !("episode" in rating) &&
            rating.show.ids.trakt === item.show.ids.trakt
          );

        return rating.episode.ids.trakt === item.episode.ids.trakt;
      });
      items.push({ ...item, ...cardInfo, ...myRating });
    }),
  );
  return items;
}

function changePage() {
  loadData();
  store.updatePage(page.value);
  router.replace({ query: { page: page.value } });
  localStorage.setItem("trakt-vue-page", page.value);
  window.scrollTo(0, 0);
}

onMounted(() => {
  store.updateFilterType("show");

  if (route.params.filter) {
    store.updateFilter(
      store.filterOptions.show.find(
        (filter) => filter.val === route.params.filter,
      )!,
    );
  }

  loadData();

  if (route.query.page && typeof route.query.page === "string")
    page.value = Number.parseInt(route.query.page, 10);
});
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="p-2 grow">
      <CardContainer
        v-if="store.loaded"
        :data="data?.items"
        :m-type="store.filterType"
        class="rounded-md"
      />
    </div>
    <footer class="pt-0 p-2">
      <div class="flex justify-center bg-black/50 p-2 rounded-md">
        <q-pagination
          v-model="page"
          color="secondary"
          active-color="secondary"
          outline
          :max="data?.pagesTotal"
          :max-pages="$q.screen.gt.sm ? maxPages : 3"
          boundary-numbers
          ripple
          unelevated
          @click="changePage"
        />
      </div>
    </footer>
  </div>
</template>
