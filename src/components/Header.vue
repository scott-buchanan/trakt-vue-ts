<script setup lang="ts">
import type { Ref } from "vue";
import type { Filter } from "~/store/models";
import type { autocompleteResult } from "~/types/header";
import type Tmdb from "~/api/tmdb.types";

import dayjs from "dayjs";
// store
import { useStore } from "~/store/index";
// api
import { getSearchResults } from "~/api/tmdb";
// assets
import fallbackPoster from "~/assets/fallback-tv.jpg";
import defaultImage from "~/assets/drawer-image-1.jpg";

// data
const router = useRouter();
const store = useStore();

const autocompleteApiResults: Ref<Array<autocompleteResult>> = ref([]);
const searchTypedValue: Ref<string> = ref("");
const selectFilterModel: Ref<Filter> = ref(store.filterOptions.show[0]);
const showMobileFilterMenu: Ref<boolean> = ref(false);
const showMenu: Ref<boolean> = ref(false);

// subscribe to store updates
store.$subscribe((mutated, state) => {
  selectFilterModel.value = state.filter;
});

// computed
const backgroundStyle = computed(() => {
  if (store.myInfo?.account.cover_image) {
    return {
      backgroundImage: `${backgroundGradient()} url(${
        store.myInfo?.account.cover_image
      }.webp)`,
    };
  }
  return {
    backgroundImage: `${backgroundGradient()} url(${defaultImage})`,
  };
});

// methods
async function dropSearch() {
  autocompleteApiResults.value = (
    await getSearchResults(searchTypedValue.value)
  )
    .map((result: any) => {
      showMenu.value = true;

      // if result is a person
      if (result.media_type === "person") {
        return {
          ...result,
          label: result.name,
          thumbnail: result.profile_path
            ? `${store.tmdbConfig?.images.secure_base_url}${store.tmdbConfig?.images.poster_sizes[0]}${result.profile_path}`
            : fallbackPoster,
        };
      } else {
        // take genre ids from show/movie and map them to store state data
        console.log(store.genres);
        const genres: string[] = store.genres[
          result.media_type === "movie" ? "movie" : "tv"
        ]
          .filter((genre: Tmdb.Genre) => result.genre_ids.includes(genre.id))
          .map((g: Tmdb.Genre) => g.name);

        return {
          ...result,
          label: result.media_type === "movie" ? result.title : result.name,
          thumbnail: result.poster_path
            ? `${store.tmdbConfig?.images.secure_base_url}${store.tmdbConfig?.images.poster_sizes[0]}${result.poster_path}`
            : fallbackPoster,
          year: dayjs(
            result.media_type === "movie"
              ? result.release_date
              : result.first_air_date,
          ).format("YYYY"),
          genres,
        };
      }
    })
    .slice(0, 10);
}
function goToDetails(item: autocompleteResult) {
  if (item.media_type === "person") {
    window.open(`https://imdb.com/name/${item.ids.imdb}`, "_blank");
    return;
  } else {
    // clear top search value
    searchTypedValue.value = "";
    autocompleteApiResults.value = [];

    if (item.media_type === "tv") {
      router.push({
        name: "show-details",
        params: {
          show: item.ids.slug,
        },
      });
    } else {
      router.push({ name: "movie-details", params: { movie: item.ids.slug } });
    }
  }
}
function searchFocus() {
  showMenu.value = autocompleteApiResults.value.length > 0;
}
function searchBlur() {
  showMenu.value = false;
}
function searchSubmit(e: Event) {
  if (searchTypedValue.value.length > 1) {
    router.push({ name: "search", params: { term: searchTypedValue.value } });
  }
  e.preventDefault();
}
function goToLogin() {
  window.location.href = `https://trakt.tv/oauth/authorize?response_type=code&
    client_id=8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3&
    redirect_uri=${process.env.REDIRECT_URI}`;
}
function logout() {
  localStorage.clear();
  store.reset();
  router.push("/tv/trending");
}
function backgroundGradient() {
  return `linear-gradient(to top right, rgba(0,0,0,.8), rgba(0,0,0,.5) 70%, rgba(0,0,0,.3)),
         linear-gradient(to top      , rgba(0,0,0,.5), rgba(0,0,0,.2) 70%, rgba(0,0,0,0)),
         linear-gradient(to right    , rgba(0,0,0,.5), rgba(0,0,0,.2) 70%, rgba(0,0,0,0)),`;
}
function handleClickFilterDropdown(e: Event) {
  showMobileFilterMenu.value = !showMobileFilterMenu.value;
  e.preventDefault();
}
function handleClickFilterItem(e: Event, key: string, option: Filter) {
  store.updateLoading(false);
  store.updateFilterType(key);
  store.updatePage(1);
  store.updateFilter(option);
  router.push({
    path: key === "movie" ? `/movie/${option.val}` : `/tv/${option.val}`,
  });
  e.preventDefault();
}
</script>

<template>
  <header class="pb-0 p-2 bg-transparent">
    <div class="relative flex p-2 bg-black/50 rounded-md sm:h-16">
      <!-- background image for mobile-->
      <div
        class="absolute inset-x-0 inset-y-0 z-0 sm:hidden bg-cover bg-center rounded-md"
        :style="backgroundStyle"
      />
      <!-------------------------------->
      <form
        class="z-10 mb-2 sm:mb-0 h-12 sm:h-full w-full sm:w-auto sm:flex-grow items-center justify-between"
        @submit="searchSubmit"
      >
        <div class="w-full h-full mb-2 sm:mb-0 mr-2">
          <div
            class="flex flex-nowrap border h-full border-white rounded-md w-full sm:max-w-3xl"
          >
            <input
              name="txtSearch"
              v-model="searchTypedValue"
              class="grow p-3 bg-transparent border-0 focus:ring-0 h-full"
              @focus="searchFocus"
              @blur="searchBlur"
              @keydown="dropSearch"
            />
            <button class="flex items-center pr-2">
              <iconify-icon icon="mdi:search" height="2em" />
            </button>
          </div>
          <div class="relative">
            <Transition name="slide-up">
              <div
                v-if="showMenu"
                class="block fixed mt-1 max-h-fit z-50 rounded-md overflow-hidden w-auto"
              >
                <ul>
                  <li
                    v-for="result in autocompleteApiResults"
                    :key="JSON.stringify(result)"
                    class="flex h-32 bg-gray-900 hover:bg-gray-800 border-b border-black last:border-0 p-3"
                    role="button"
                    @click="goToDetails(result)"
                  >
                    <img
                      class="object-cover object-center max-h-full aspect-[2/3]"
                      :src="result.thumbnail"
                      aria-hidden="true"
                    />
                    <div class="flex flex-col justify-center pl-3">
                      <div>
                        <iconify-icon
                          :icon="
                            result.media_type === 'movie'
                              ? 'icon-park-outline:movie'
                              : 'wpf:retro-tv'
                          "
                          class="mr-1"
                        />
                        <b>{{ result.label }}</b>
                      </div>
                      <div v-if="result.year">{{ result.year }}</div>
                      <div>
                        <small v-if="result.known_for">
                          <template v-for="(item, index) in result.known_for">
                            {{ item.original_title || item.original_name
                            }}<template
                              v-if="index !== result.known_for.length - 1"
                              >,
                            </template>
                          </template>
                        </small>
                        <small
                          v-else
                          v-for="(genre, index) in result.genres"
                          :key="genre"
                          class="text-capitalize"
                        >
                          {{ genre
                          }}<template v-if="index !== result.genres.length - 1"
                            >,
                          </template>
                        </small>
                      </div>
                    </div>
                  </li>
                  <li
                    class="px-3 py-5 bg-gray-900 hover:bg-gray-800"
                    role="button"
                    type="submit"
                  >
                    See all results for "{{ searchTypedValue }}"
                  </li>
                </ul>
              </div>
            </Transition>
          </div>
        </div>
      </form>

      <!-- if mobile show dropdown for filter -->
      <div class="sm:hidden z-10 grow h-12 sm:h-full">
        <button
          aria-label="Filter"
          class="rounded-md border-solid border border-white p-3 w-full"
          @click="handleClickFilterDropdown"
          @blur="showMobileFilterMenu = false"
        >
          <div class="flex no-wrap justify-between items-center">
            <div>{{ selectFilterModel.label }}</div>
            <div>
              <iconify-icon
                icon="bi:caret-down-fill"
                width="1.2em"
                height="1.2em"
                class="inline-block vertical-middle transition-all"
                :class="{
                  'rotate-180 duration-300 ease-in-out': showMobileFilterMenu,
                }"
              />
            </div>
          </div>
        </button>
        <div class="relative w-full">
          <Transition name="slide-up">
            <ul
              v-if="showMobileFilterMenu"
              class="absolute w-full mt-1 top-0 left-0 bg-black/80 rounded-md z-50 border border-dark-list"
            >
              <template v-for="(filter, key) in store.filterOptions">
                <li class="text-dark-list py-2 px-3 uppercase">
                  {{ key === "movie" ? "movies" : "tv shows" }}
                </li>
                <li
                  v-for="option in filter"
                  :key="JSON.stringify(option)"
                  class="p-1 hover:bg-slate-200/10"
                  role="button"
                  @click="(e) => handleClickFilterItem(e, key, option)"
                >
                  <div class="p-2">{{ option.label }}</div>
                </li>
              </template>
            </ul>
          </Transition>
        </div>
      </div>

      <div class="z-10 self-center ml-2 h-full">
        <Button v-if="store.myInfo" @click="logout" class="h-12 sm:h-full">
          <iconify-icon icon="ic:round-logout" width="1.5em" height="1.5em" />
          <div>logout</div>
        </Button>
        <Button v-else @click="goToLogin" class="h-12 sm:h-full">
          <iconify-icon
            icon="simple-icons:trakt"
            width="1.5em"
            height="1.5em"
            class="text-trakt mr-2"
          />
          <div>login</div>
        </Button>
      </div>
    </div>
  </header>
</template>
