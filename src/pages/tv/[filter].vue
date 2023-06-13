<script setup lang="ts">
import type { Ref } from 'vue'
import { useQuasar } from 'quasar'

// api
import { getAnticipated, getCommunityRecommended, getRecommendationsFromMe, getTrending, getWatchedHistory } from '~/api/trakt'
import { getEpisodeInfoCard, getShowInfoCard } from '~/api/combinedCalls'

// store
import { useStore } from '~/store/index'

// components
import CardContainer from '~/components/CardContainer.vue'

import type Trakt from '~/api/trakt.types'

const props = defineProps<{ filter: string }>()
const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const store = useStore()

// data
const data = ref({})
const filter = ref(store.filter)
const maxPages = ref(10)
const myEpRatings: Ref<Trakt.Ratings | null> = ref(null)
const myShowRatings = ref(null)
const page = ref(store.page)
const tokens = ref(store.tokens)

store.$subscribe((mutated, state) => {
  let triggerLoad = false
  if (state.filterType === 'show' && state.filter && state.filter.val !== filter.value.val)
    triggerLoad = true

  filter.value = state.filter
  tokens.value = state.tokens
  page.value = state.page

  if (triggerLoad)
    loadData()
})

onMounted(() => {
  store.updateFilterType('show')
  // if (route.params?.filter) {
  //   store.updateFilter(
  //     store.filterOptions.show.find(filter => filter.val === route.params.filter),
  //   )
  // }
  const foundFilter = store.filterOptions.show.find(filter => filter.val === props.filter)
  if (foundFilter)
    store.updateFilter(foundFilter)

  loadData()

  if (route.query.page && typeof route.query.page === 'string')
    page.value = Number.parseInt(route.query.page, 10)
})

async function loadData() {
  store.updateLoading(false)

  // this makes it so the card container always has a full last line
  localStorage.setItem('item-limit', '18')

  if (store.filterType === 'show' && filter.value?.val === 'history') {
    // get Trakt data
    data.value = await getWatchedHistory('episodes', page.value)

    // get episode ratings object from local storage
    myEpRatings.value = JSON.parse(localStorage.getItem('trakt-vue-episode-ratings')!)

    // get images and ratings
    const items = await fetchCardInfo('episode', myEpRatings.value)

    // sort by watched date (no logic here because only one filter)
    items.sort((a, b) => new Date(b.watched_at) - new Date(a.watched_at))

    data.value.items = [...items]
  }
  else {
    switch (filter.value?.val) {
      case 'anticipated':

        data.value = await getAnticipated('shows', page.value)
        break
      case 'trakt_recommended':
        data.value = await getCommunityRecommended('shows', page.value)
        break
      case 'recommended':
        data.value = await getRecommendationsFromMe('shows', page.value)
        break
      case 'trending':
        data.value = await getTrending('shows', page.value)
        break
      default:
        store.updateLoading(true)
        return
    }

    // get show ratings object from local storage
    myShowRatings.value = JSON.parse(localStorage.getItem('trakt-vue-show-ratings')!)
    // get images and ratings
    const items = await fetchCardInfo('show', myShowRatings.value)
    if (filter.value.val === 'recommended')
      items.sort((a, b) => a.rank - b.rank)
    else if (filter.value.val === 'trending')
      items.sort((a, b) => b.watchers - a.watchers)

    data.value.items = [...items]
  }
  store.updateLoading(true)
}

async function fetchCardInfo(mType: string, ratingsObj: Trakt.Ratings) {
  const items = []
  await Promise.all(
    data.value.items.map(async (item) => {
      const cardInfo
            = mType === 'show'
              ? await getShowInfoCard(item.show)
              : await getEpisodeInfoCard(item.show, item.episode)
      const myRating = { my_rating: null }
      myRating.my_rating = ratingsObj?.ratings.find((rating) => {
        if (mType === 'show')
          return !('episode' in rating) && rating.show.ids.trakt === item.show.ids.trakt

        return rating.episode.ids.trakt === item.episode.ids.trakt
      })
      // console.log({ ...item, ...cardInfo, ...myRating })
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
  <div v-if="store.loaded" class="full-height q-pa-sm tv-container">
    <CardContainer :data="data.items" :m-type="store.filterType" />
  </div>
  <q-footer v-if="store.loaded && data?.pagesTotal > 1" class="text-white q-pa-sm footer">
    <q-toolbar class="flex flex-center">
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
    </q-toolbar>
  </q-footer>
</template>

<style lang="scss" scoped>
@import '~/quasar-variables.scss';

.tv-container {
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
