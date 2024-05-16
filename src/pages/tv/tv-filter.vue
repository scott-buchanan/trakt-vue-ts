<script setup lang="ts">
import type { Ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
// api
import {
  getAnticipated,
  getCommunityRecommended,
  getRecommendationsFromMe,
  getTrending,
  getWatchedHistory,
} from '~/api/trakt'
import { getEpisodeInfoCard, getShowInfoCard } from '~/api/combinedCalls'

// store
import { useStore } from '~/store/index'

// components
import CardContainer from '~/components/CardContainer.vue'

import type Trakt from '~/api/trakt.types'
import type { Filter } from '~/store/models'
import type { CardInfo } from '~/api/combinedCall.types'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const store = useStore()

// data
const data: Ref<Trakt.EpisodeData | null> = ref(null)
const filter: Ref<Filter> = ref(store.filter)
const maxPages: Ref<number> = ref(10)
const myEpRatings: Ref<Trakt.Ratings | null> = ref(null)
const page: Ref<string> = ref(route.query.page as string || '1')

const myShowRatings: Ref<Trakt.Ratings> = ref({} as Trakt.Ratings)
const tokens: Ref<Trakt.AuthTokens | null> = ref(store.tokens)

store.$subscribe((mutated, state) => {
  filter.value = state.filter
  tokens.value = state.tokens
})

watch(() => route.query.page, (newPage) => {
  page.value = newPage as string
  store.updatePage(page.value)
  loadData(page.value)
})

async function loadData(page: string) {
  store.updateLoading(false)

  // if watched history
  if (filter.value.val === 'history') {
    // get Trakt data
    if (store.myInfo) {
      data.value = await getWatchedHistory('shows', store.myInfo.user.username, page) as Trakt.EpisodeData

      // get episode ratings object from local storage
      myEpRatings.value = JSON.parse(
        localStorage.getItem('trakt-vue-episode-ratings') || '{}',
      )

      // get images and ratings
      const items = await fetchCardInfo('episode', myEpRatings.value)

      // sort by watched date (no logic here because only one filter)
      items.sort(
        (a: CardInfo, b: CardInfo) =>
          new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime(),
      )

      data.value.items = [...items]
    }
  }
  else {
    switch (filter.value?.val) {
      case 'anticipated':
        data.value = await getAnticipated('shows', page)
        break
      case 'trakt_recommended':
        data.value = await getCommunityRecommended('shows', page)
        break
      case 'recommended':
        data.value = await getRecommendationsFromMe('shows', page)
        break
      case 'trending':
        data.value = await getTrending('shows', page)
        break
      default:
        store.updateLoading(true)
        return
    }

    // get show ratings object from local storage
    myShowRatings.value = JSON.parse(
      localStorage.getItem('trakt-vue-show-ratings')!,
    )
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

async function fetchCardInfo(mType: string, ratingsObj: Trakt.Ratings | null) {
  const getCardInfo = async (item) => {
    if (mType === 'show')
      return await getShowInfoCard(item.show as Trakt.Show)

    else return await getEpisodeInfoCard(item.show as Trakt.Show, item.episode as Trakt.Episode)
  }

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
      const cardInfo = await getCardInfo(item)
      const myRating = findMyRating(item)
      return { ...item, ...cardInfo, ...myRating }
    }),
  )

  return items
}

function changePage() {
  router.push({ path: route.path, query: { page: page.value } })
}

onMounted(() => {
  store.updateFilterType('show')

  if (route.params.filter) {
    filter.value = store.filterOptions.show.find(
      (f: Filter) => f.val === route.params.filter,
    ) || store.filterOptions.show[0]
    store.updateFilter(filter.value)
  }

  loadData(page.value)
})
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
