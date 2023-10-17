<script setup lang="ts">
import type { Ref } from 'vue'
import dayjs from 'dayjs'
import { useQuasar } from 'quasar'
import type { Filter } from '~/store/models'
import type { autocompleteResult } from '~/types/header'
import fallbackPoster from '~/assets/fallback-tv.jpg'
import traktIcon from '~/assets/trakt-icon-red.svg'
import defaultImage from '~/assets/drawer-image-1.jpg'

// store
import { useStore } from '~/store/index'

// api
import { getSearchResults } from '~/api/tmdb'

// data
const $q = useQuasar()
const router = useRouter()
const store = useStore()
const autocompleteApiResults: Ref<Array<autocompleteResult>> = ref([])
const searchHasFocus = ref(false)
const searchTypedValue: Ref<string> | Ref<null> | Ref<number> = ref('')
const menuVisible = ref(store.menuVisible)
const { ready: autocompleteReady, start: autocompleteStart, stop: autocompleteStop } = useTimeout(0, { controls: true })

store.$subscribe((mutated, state) => {
  menuVisible.value = state.menuVisible
})

// computed
const selectFilterModel = computed(() => store.filter.label ? store.filter.label : 'Make a selection')
const selectFilterLabel = computed(() => {
  if (store.filter.label)
    return store.filterType === 'movie' ? 'Movies' : 'TV'

  return 'Filter'
})
const selectFilterOptions = computed(() => {
  const arrOptions: Array<object> = []
  Object.entries(store.filterOptions).forEach((filter) => {
    filter[1].forEach((item, index) => {
      const header: { filter: string | null; isFirst: boolean | null } = { filter: null, isFirst: null }
      header.filter = filter[0] === 'movie' ? 'Movies' : 'TV'
      if (index === 0)
        header.isFirst = true

      if (!store.myInfo) {
        if (!item.auth)
          arrOptions.push({ ...header, ...item })
      }
      else {
        arrOptions.push({ ...header, ...item })
      }
    })
  })
  return arrOptions
})
const showMenu = computed(() => {
  return searchHasFocus.value && menuVisible && autocompleteApiResults.value.length > 0
})
const backgroundStyle = computed(() => {
  if ($q.screen.gt.xs === false) {
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
  }
  return ''
})

// watch
watch(autocompleteReady, async () => {
  if (autocompleteReady.value === true)
    await fireSearch()
})

// methods
function handleMenuClick(item: Filter, filterType: string) {
  store.updateLoading(false)
  store.updateFilterType(filterType === 'Movies' ? 'movie' : 'show')
  store.updatePage(1)
  store.updateFilter(item)
  router.push({
    path: filterType === 'Movies' ? `/movie/${item.val}` : `/tv/${item.val}`,
  })
}
function handleSearchBlur() {
  if (!document.activeElement?.className.includes('autocomplete-item'))
    searchHasFocus.value = false
}
async function preSearchCheck(value: string | number | null) {
  if (typeof value === 'string') {
    autocompleteStop()
    searchTypedValue.value = value
    if (value?.length > 1)
      autocompleteStart()
    else autocompleteApiResults.value = []
  }
}
async function fireSearch() {
  store.updateMenuVisible(true)
  const results = await getSearchResults(searchTypedValue.value)
  autocompleteApiResults.value = results.map((result) => {
    const genres = store.genres[result.media_type].filter(genre => result.genre_ids.includes(genre.id)).map(g => g.name)
    return {
      ids: result.ids,
      label: result.media_type === 'movie' ? result.title : result.name,
      value: result.id,
      type: result.media_type,
      thumbnail: result.poster_path
        ? `${store.imageUrls.images.base_url}${store.imageUrls.images.poster_sizes[0]}${result.poster_path}`
        : fallbackPoster,
      year: dayjs(
        result.media_type === 'movie' ? result.release_date : result.first_air_date,
      ).format('YYYY'),
      genres,
    }
  }).slice(0, 10)
}
async function goToDetails(item: autocompleteResult) {
  const mType = item.type === 'movie' ? 'movie' : 'show'
  const urlTitle = item.ids.slug
  const params = {
    [mType]: urlTitle,
  }

  searchTypedValue.value = ''
  autocompleteApiResults.value = []

  if (mType === 'show' && item.episode) {
    params.season = item.episode.season
    params.episode = item.episode.number
    router.push({
      path: `/show/${urlTitle}/season/${params.season}/episode/${params.episode}`,
      params,
    })
  }
  else if (mType === 'show') {
    router.push({
      path: `/show/${urlTitle}`,
      params,
    })
  }
  else {
    router.push({ name: 'movie-details', params: { movie: item.ids.slug } })
  }
}
function goSearch(event: Event | null = null) {
  if (searchTypedValue.value?.length > 0) {
    if (!event || (event as KeyboardEvent).key?.toLowerCase() === 'enter' || event.type === 'click') {
      store.updateMenuVisible(false)
      const searchTerm = searchTypedValue.value
      searchTypedValue.value = ''
      autocompleteApiResults.value = []
      router.push({ name: 'search', params: { term: searchTerm } })
    }
  }
}
function goToLogin() {
  window.location.href
        = 'https://trakt.tv/oauth/authorize?response_type=code&client_id=8b333edc96a59498525b416e49995b338e2c53a03738becfce16461c1e1086a3&redirect_uri=http://localhost:8080'
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
</script>

<template>
  <q-header reveal height-hint="98" class="header q-pa-sm">
    <div
      class="header-back row items-center justify-between q-pa-sm"
      :style="backgroundStyle"
    >
      <q-input
        ref="searchInput"
        v-model="searchTypedValue"
        color="secondary"
        label-color="white"
        label="Search"
        outlined
        dense
        dark
        class="col-xs-grow col-xs-shrink col-sm-6 q-mr-sm" :class="[
          { 'order-last full-width': $q.screen.gt.xs === false },
          $q.screen.gt.xs === false ? 'q-mt-sm' : 'aq-my-sm',
        ]"
        clearable
        @update:model-value="preSearchCheck"
        @focus="searchHasFocus = true"
        @blur="handleSearchBlur"
        @clear="autocompleteApiResults = []"
        @keydown="goSearch"
      >
        <template #append>
          <button @click="goSearch">
            <q-icon name="o_search" />
          </button>
        </template>
      </q-input>
      <q-menu
        :model-value="showMenu"
        :target="$refs.searchInput as string"
        no-parent-event
        no-focus
        :offset="[0, 5]"
        max-height="90vh"
        fit
        persistent
        no-refocus
        class="autocomplete-menu"
        transition-duration="80"
      >
        <q-list>
          <q-item
            v-for="result in autocompleteApiResults"
            :key="result.value"
            v-close-popup
            class="autocomplete-item"
            clickable
            @click="goToDetails(result)"
          >
            <q-item-section
              :style="{
                height: '90px',
              }"
              class="q-pl-sm"
              thumbnail
            >
              <img class="full-height" :src="result.thumbnail" alt="">
            </q-item-section>
            <q-item-section>
              <div class="q-mb-xs flex items-center">
                <b>{{ result.label }}</b>
                <q-chip
                  :label="result.type === 'movie' ? 'Movie' : 'TV Show'"
                  square
                  color="white"
                  dense
                  size="sm"
                  :icon="result.type === 'movie' ? 'o_theaters' : 'o_tv'"
                  class="q-ml-sm"
                />
              </div>
              <div>{{ result.year }}</div>
              <div>
                <template v-for="(genre, index) in result.genres" :key="genre">
                  <small class="text-capitalize">
                    {{ genre }}<template v-if="index !== result.genres.length - 1">, </template>
                  </small>
                </template>
              </div>
            </q-item-section>
          </q-item>
          <q-item
            v-close-popup
            class="autocomplete-item"
            clickable
            @click="goSearch()"
          >
            See all results for "{{ searchTypedValue }}"
          </q-item>
        </q-list>
      </q-menu>
      <q-select
        v-if="$q.screen.gt.xs === false"
        v-model="selectFilterModel"
        :options="selectFilterOptions"
        :label="selectFilterLabel"
        color="secondary"
        label-color="white"
        class="filter-select"
        dense
        dark
        outlined
      >
        <template #option="data">
          <q-list>
            <q-item-label v-if="data.opt.isFirst" header>
              {{ data.opt.filter }}
            </q-item-label>
            <q-item clickable @click="handleMenuClick(data.opt, data.opt.filter)">
              <span class="q-ml-md">{{ data.opt.label }}</span>
            </q-item>
          </q-list>
        </template>
      </q-select>
      <q-btn-dropdown v-if="store.myInfo" flat no-caps dense :ripple="false" class="col-auto">
        <template #label>
          <q-avatar size="md">
            <img :src="store.myInfo?.user.images.avatar.full" :alt="store.myInfo?.user.name" referrerpolicy="no-referrer">
          </q-avatar>
        </template>
        <q-list class="bg-grey-10">
          <q-item v-close-popup clickable @click="logout">
            <q-item-section>
              <q-item-label>Logout</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="o_logout" color="white" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <q-btn
        v-else
        class="login-button"
        text-color="white"
        outline
        :ripple="false"
        @click="goToLogin"
      >
        <q-avatar size="20px">
          <img :src="traktIcon" alt="">
        </q-avatar>
        <div class="q-pl-sm">
          Login
        </div>
      </q-btn>
    </div>
  </q-header>
</template>

<style lang="scss" scoped>
@import '~/quasar-variables.scss';

.header {
  background: transparent;
  padding-bottom: 0;
  & > div {
    @include background-style;
  }
  & .header-back {
    background-size: cover;
    background-position: center center;
  }
  & .login-button {
    height: 40px;
    &::before {
      border-color: rgba(255, 255, 255, 0.6);
    }
  }
}
.scroll-area {
  width: 100%;
  height: 90vh;
}
.autocomplete-item {
  background-color: #1f1f1f;
  border-bottom: 1px solid $accent;
  font-size: 1.2em;
  &:hover {
    background-color: #313131;
  }
  &:last-child {
    border: none;
  }
  & :first-child {
    width: auto;
    padding: 0;
  }
  & img {
    object-fit: cover;
    aspect-ratio: 1/1.5;
  }
}
</style>
