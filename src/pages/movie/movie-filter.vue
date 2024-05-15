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

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const store = useStore()

// data
const data = ref({})
const filter = ref(store.filter)
const maxPages = ref(10)
const myMovieRatings: Ref<Trakt.Ratings | null> = ref(null)
const page = ref(store.page)
const tokens = ref(store.tokens)

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
    page.value = Number.parseInt(route.query.page, 10)
})

// computed
const screenGreaterThan = computed(() => {
  return $q.screen.gt
})

// methods
async function loadData() {
  store.updateLoading(false)

  // this makes it so the card container always has a full last line
  localStorage.setItem('item-limit', '18')

  switch (filter.value?.val) {
    case 'history':
      data.value = await getWatchedHistory('movies', page.value)
      break
    case 'recommended':
      data.value = await getRecommendationsFromMe('movies', page.value)
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
    items.sort((a, b) => new Date(b.watched_at) - new Date(a.watched_at))
  else if (filter?.value.val === 'trending')
    items.sort((a, b) => b.watchers - a.watchers)

  data.value.items = [...items]

  store.updateLoading(true)
}
async function fetchCardInfo(ratingsObj: Trakt.Ratings) {
  const items = []
  await Promise.all(
    data.value.items.map(async (item) => {
      const cardInfo = await getMovieInfoCard(item.movie)
      const myRating = {}
      myRating.my_rating = ratingsObj?.ratings.find(
        rating => rating.movie.ids.trakt === item.movie.ids.trakt,
      )
      items.push({ ...item, ...cardInfo, ...myRating })
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
