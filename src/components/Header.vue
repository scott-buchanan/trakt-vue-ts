<script setup lang="ts">
import type { Ref } from 'vue'
import dayjs from 'dayjs'
import type { Filter, FilterType } from '~/stores/mainStore.types'
import type { autocompleteResult } from '~/types/header'
import type Tmdb from '~/api/tmdb.types'

// store
import { useStore } from '~/stores/mainStore'
// api
import { getSearchResults } from '~/api/tmdb'
// assets
import fallbackPoster from '~/assets/fallback-tv.jpg'
import defaultImage from '~/assets/drawer-image-1.jpg'

// data
const router = useRouter()
const store = useStore()

const autocompleteApiResults: Ref<Array<autocompleteResult>> = ref([])
const searchTypedValue: Ref<string> = ref('')
// const selectFilterModel: Ref<Filter> = ref(store.filterOptions.show[0])
const showMobileFilterMenu: Ref<boolean> = ref(false)
const showMenu: Ref<boolean> = ref(false)
const backgroundInfo: Ref<Tmdb.BackgroundInfo | null> = ref(null)

// subscribe to store updates
store.$subscribe((mutated, state) => {
  // selectFilterModel.value = state.filter
  backgroundInfo.value = state.backgroundInfo
})

// computed
const backgroundStyle = computed(() => {
  if (store.myInfo?.account.cover_image) {
    return {
      backgroundImage: `${backgroundGradient()} url(${
        store.myInfo?.account.cover_image
      }.webp)`,
    }
  }
  return {
    backgroundImage: `${backgroundGradient()} url(${defaultImage})`,
  }
})

// methods
async function dropSearch() {
  autocompleteApiResults.value = (
    await getSearchResults(searchTypedValue.value)
  )
    .map((result: any) => {
      showMenu.value = true
      // if result is a person
      if (result.media_type === 'person') {
        return {
          ...result,
          label: result.name,
          thumbnail: result.profile_path
            ? `${store.tmdbConfig?.images.secure_base_url}${store.tmdbConfig?.images.poster_sizes[0]}${result.profile_path}`
            : fallbackPoster,
        }
      }
      else {
        // take genre ids from show/movie and map them to store state data
        const genres: string[] = store.genres[
          result.media_type === 'movie' ? 'movie' : 'tv'
        ]
          .filter((genre: Tmdb.Genre) => result.genre_ids.includes(genre.id))
          .map((g: Tmdb.Genre) => g.name)
        return {
          ...result,
          label: result.media_type === 'movie' ? result.title : result.name,
          thumbnail: result.poster_path
            ? `${store.tmdbConfig?.images.secure_base_url}${store.tmdbConfig?.images.poster_sizes[0]}${result.poster_path}`
            : fallbackPoster,
          year: dayjs(
            result.media_type === 'movie'
              ? result.release_date
              : result.first_air_date,
          ).format('YYYY'),
          genres,
        }
      }
    })
    .slice(0, 10)
}
function goToDetails(item: autocompleteResult) {
  if (item.media_type === 'person') {
    window.open(`https://imdb.com/name/${item.ids.imdb}`, '_blank')
  }
  else {
    // clear top search value
    searchTypedValue.value = ''
    autocompleteApiResults.value = []

    if (item.media_type === 'tv') {
      router.push({
        name: 'show-details',
        params: {
          show: item.ids.slug,
        },
      })
    }
    else {
      router.push({ name: 'movie-details', params: { movie: item.ids.slug } })
    }
  }
}
function searchFocus() {
  showMenu.value = autocompleteApiResults.value.length > 0
}
function searchBlur() {
  showMenu.value = false
}
function searchSubmit(e: Event) {
  if (searchTypedValue.value.length > 1)
    router.push({ name: 'search', params: { term: searchTypedValue.value } })

  e.preventDefault()
}
function goToLogin() {
  window.location.href
    = `https://trakt.tv/oauth/authorize?redirect_uri=${
      import.meta.env.VITE_REDIRECT_URI
    }&response_type=code&`
    + 'client_id=8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3'
}
function logout() {
  localStorage.clear()
  store.reset()
  router.push('/tv/trending')
}
function backgroundGradient() {
  return `linear-gradient(to top right, rgba(0,0,0,.8), rgba(0,0,0,.5) 70%, rgba(0,0,0,.3)),
         linear-gradient(to top      , rgba(0,0,0,.5), rgba(0,0,0,.2) 70%, rgba(0,0,0,0)),
         linear-gradient(to right    , rgba(0,0,0,.5), rgba(0,0,0,.2) 70%, rgba(0,0,0,0)),`
}
function handleClickFilterDropdown(e: Event) {
  showMobileFilterMenu.value = !showMobileFilterMenu.value
  e.preventDefault()
}
function handleClickFilterItem(e: Event, key: FilterType, option: Filter) {
  store.updateLoading(false)
  store.updateFilterType(key)
  store.updatePage(1)
  store.updateFilter(option)
  router.push({
    path: key === 'movie' ? `/movie/${option.val}` : `/tv/${option.val}`,
  })
  e.preventDefault()
}
</script>

<template>
  <header class="pb-0 p-2 bg-transparent">
    <div class="relative flex flex-wrap p-2 bg-black/50 rounded-md h-full">
      <!-- background image for mobile -->
      <div
        class="absolute inset-x-0 inset-y-0 z-0 md:hidden bg-cover bg-center rounded-md"
        :style="backgroundStyle"
      />
      <!-------------------------------->
      <form
        class="z-20 mb-2 md:mb-0 w-full md:w-auto md:flex-grow items-center justify-between"
        @submit="searchSubmit"
      >
        <div class="w-full">
          <div
            class="h-12 md:h-full flex flex-nowrap rounded-md w-full md:max-w-3xl p-1 border border-solid border-white/25 bg-black/50 backdrop-blur-sm"
          >
            <input
              v-model="searchTypedValue"
              name="txtSearch"
              class="md:h-full grow p-3 w-full bg-transparent border-0 focus:ring-0 placeholder-slate-300/75"
              :placeholder="
                backgroundInfo ? `Search: e.g. ${backgroundInfo?.title}` : ''
              "
              @focus="searchFocus"
              @blur="searchBlur"
              @keydown="dropSearch"
            >
            <button class="flex items-center pr-2">
              <iconify-icon icon="mdi:search" height="2em" />
            </button>
          </div>
          <div>
            <Transition name="slide-up">
              <div
                v-if="showMenu"
                class="md:max-w-3xl mt-1 max-h-fit rounded-md"
              >
                <ul>
                  <li
                    v-for="result in autocompleteApiResults"
                    :key="JSON.stringify(result)"
                    class="grid grid-cols-[auto,1fr] grid-rows-1 h-24 bg-slate-900 hover:bg-slate-800 p-3 border-b border-slate-300/25"
                    role="button"
                    @click="goToDetails(result)"
                  >
                    <img
                      class="object-cover object-center h-full aspect-[2/3]"
                      :src="result.thumbnail"
                      aria-hidden="true"
                    >
                    <div class="ml-3 overflow-hidden">
                      <div
                        class="text-slate-200 overflow-hidden whitespace-nowrap text-ellipsis"
                      >
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
                      <div v-if="result.year" class="text-slate-300">
                        {{ result.year }}
                      </div>
                      <div
                        class="text-slate-300 overflow-hidden whitespace-nowrap text-ellipsis"
                      >
                        <small v-if="result.known_for">
                          <template v-for="(item, index) in result.known_for">
                            {{ item.original_title || item.original_name
                            }}{{
                              index !== result.known_for.length - 1 ? "," : ""
                            }}
                          </template>
                        </small>
                        <small
                          v-for="(genre, index) in result.genres"
                          v-else
                          :key="genre"
                          class="text-capitalize"
                        >
                          {{ genre
                          }}<template v-if="index !== result.genres.length - 1">,
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
      <div class="md:hidden w-full sm:w-auto grow h-12">
        <button
          aria-label="Filter"
          class="rounded-md p-3 w-full h-full border border-solid border-white/25 bg-black/50 backdrop-blur-sm"
          @click="handleClickFilterDropdown"
          @blur="showMobileFilterMenu = false"
        >
          <div class="flex no-wrap justify-between items-center">
            <div>
              {{ store.filter.label }}
            </div>
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
              class="absolute w-full mt-1 top-0 left-0 z-40 rounded-md border border-slate-300/25 overflow-hidden"
            >
              <template v-for="(filter, key) in store.filterOptions" :key="key">
                <li class="text-dark-list py-2 px-3 uppercase bg-slate-900">
                  {{ key === "movie" ? "movies" : "tv shows" }}
                </li>
                <li
                  v-for="option in filter"
                  :key="JSON.stringify(option)"
                  class="p-1 pl-3 bg-slate-900 hover:bg-slate-800"
                  role="button"
                  @click="e => handleClickFilterItem(e, key, option)"
                >
                  <div class="p-2">
                    {{ option.label }}
                  </div>
                </li>
              </template>
            </ul>
          </Transition>
        </div>
      </div>

      <div class="self-center sm:ml-2 h-12 md:h-full w-full sm:w-auto mt-2 sm:mt-0">
        <Button v-if="store.myInfo" class="h-full w-full flex flex-nowrap items-center" @click="logout">
          <iconify-icon
            icon="ic:round-logout"
            width="1.5em"
            height="1.5em"
            class="mr-1"
          />
          <div>logout</div>
        </Button>
        <Button v-else class="h-full" @click="goToLogin">
          <iconify-icon
            icon="simple-icons:trakt"
            width="1.5em"
            height="1.5em"
            class="text-trakt mr-1"
          />
          <div>login</div>
        </Button>
      </div>
    </div>
  </header>
</template>
