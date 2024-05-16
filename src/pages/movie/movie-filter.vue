<script setup lang="ts">
import type { Ref } from 'vue'
import { useQuasar } from 'quasar'

// api
import { getRecommendationsFromMe, getTrending, getWatchedHistory } from '~/api/trakt'
import { getMovieInfoCard } from '~/api/combinedCalls'

// store
import { useStore } from '~/store/index'

// components
import CardContainer from '~/components/CardContainer.vue'

// types
import type Trakt from '~/api/trakt.types'
import type { Filter } from '~/store/models'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const store = useStore()

// refs
const data: Ref<Trakt.MovieData | null> = ref(null)
const filter: Ref<Filter> = ref(store.filter)
const myMovieRatings: Ref<Trakt.Ratings | null> = ref(null)
const page: Ref<string> = ref(store.page)
const tokens: Ref<Trakt.AuthTokens | null> = ref(store.tokens)

// static
const maxPages: number = 10

store.$subscribe((mutated, state) => {
  let triggerLoad = false
  if (state.filterType === 'movie' && state.filter !== filter.value)
    triggerLoad = true

  filter.value = state.filter
  tokens.value = state.tokens
  page.value = state.page

  if (triggerLoad)
    loadData()
})

// lifecycle methods
onMounted(() => {
  store.updateFilterType('movie')

  const foundFilter = store.filterOptions.show.find(filter => filter.val === route.params?.filter)
  if (foundFilter)
    store.updateFilter(foundFilter)

  loadData()

  if (route.query.page && typeof route.query.page === 'string')
    page.value = route.query.page
})

// computed
const screenGreaterThan = computed(() => {
  return $q.screen.gt
})

// methods
async function loadData() {
  store.updateLoading(false)

  switch (filter.value?.val) {
    case 'history':
      data.value = await getWatchedHistory('movies', page.value) as Trakt.MovieData
      break
    case 'recommended':
      if (store.myInfo)
        data.value = await getRecommendationsFromMe('movies', store.myInfo.user.username, page.value)
      break
    case 'trending':
      data.value = await getTrending('movies', page.value)
      break
    default:
      store.updateLoading(true)
      return
  }

  // get movie ratings object from local storage
  myMovieRatings.value = JSON.parse(localStorage.getItem('trakt-vue-movie-ratings')!)

  // get images and ratings
  const items = await fetchCardInfo(myMovieRatings.value)

  if (filter.value?.val === 'history')
    items.sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime())
  else if (filter?.value.val === 'trending')
    items.sort((a, b) => b.watchers - a.watchers)

  data.value.items = [...items]

  store.updateLoading(true)
}
async function fetchCardInfo(ratingsObj: Trakt.Ratings) {
  const findMyRating = (item: any) => {
    return ratingsObj?.ratings.find((rating) => {
      if (mType === 'show')
        return !('episode' in rating) && rating.show.ids.trakt === item.show.ids.trakt
      else
        return rating.episode.ids.trakt === item.episode.ids.trakt
    }) || { my_rating: null }
  }

  const items = await Promise.all(
    data.value.items.map(async (item) => {
      const cardInfo = await getMovieInfoCard(item.movie)
      const myRating = findMyRating(item)
      return { ...item, ...cardInfo, ...myRating }
    }),
  )

  return items
}

function changePage() {
  loadData()
  store.updatePage(page.value)
  router.replace({ query: { page: page.value } })
  localStorage.setItem('trakt-vue-page', page.value)
  window.scrollTo(0, 0)
}
</script>

<template>
  <div v-if="store.loaded" class="full-height q-pa-sm movie-container">
    <CardContainer :data="data.items" m-type="movie" />
  </div>
  <q-footer v-if="store.loaded && data?.pagesTotal > 1" class="text-white q-pa-sm footer">
    <q-toolbar class="flex flex-center">
      <q-pagination
        v-model="page"
        color="secondary"
        active-color="secondary"
        outline
        :max="data?.pagesTotal"
        :max-pages="screenGreaterThan.sm ? maxPages : 3"
        boundary-numbers
        ripple
        unelevated
        @click="changePage"
      />
    </q-toolbar>
  </q-footer>
</template>

<style lang="scss" scoped>
@import '~/quasar-variables.scss';

.movie-container {
  padding-top: 0;
  & > div {
    @include background-style;
    overflow: hidden;
  }
}
.footer {
  padding-top: 0;
  background-color: transparent !important;
  & > div {
    @include background-style;
  }
}
</style>
