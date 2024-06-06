<script setup lang="ts">
import type { Ref } from 'vue'
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
import { useStore } from '~/stores/mainStore'

// components
import CardContainer from '~/components/CardContainer.vue'

import type Trakt from '~/api/trakt.types'
import type { Filter } from '~/stores/mainStore.types'
import type { EpisodeCardInfo, ShowCardInfo } from '~/api/combinedCall.types'

const route = useRoute()
const router = useRouter()
const store = useStore()

// refs
const data: Ref<Trakt.EpisodeData | null> = ref(null)
const filter: Ref<Filter> = ref(store.filter)
const myEpRatings: Ref<Trakt.Ratings | null> = ref(null)
const currentPage: Ref<number> = ref(
  Number.parseInt(route.query.page as string) || 1,
)

const myShowRatings: Ref<Trakt.Ratings> = ref({} as Trakt.Ratings)
const tokens: Ref<Trakt.AuthTokens | null> = ref(store.tokens)

store.$subscribe((mutated, state) => {
  filter.value = state.filter
  tokens.value = state.tokens
})

watch(
  () => route.query.page,
  (newPage) => {
    currentPage.value = Number.parseInt(newPage as string)
    store.updatePage(currentPage.value)
    loadData(currentPage.value)
  },
)

async function loadData(page: number) {
  store.updateLoading(false)

  // if watched history
  if (filter.value.val === 'history') {
    // get Trakt data
    if (store.myInfo) {
      data.value = (await getWatchedHistory(
        'shows',
        store.myInfo.user.username,
        page,
      ))

      // get episode ratings object from local storage
      myEpRatings.value = JSON.parse(
        localStorage.getItem('trakt-vue-episode-ratings') || '{}',
      )

      // get images and ratings
      const items: EpisodeCardInfo[] = await fetchCardInfo('episode', myEpRatings.value)

      // sort by watched date (no logic here because only one filter)
      items.sort(
        (a: EpisodeCardInfo, b: EpisodeCardInfo) =>
          new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime(),
      )

      data.value.items = [...items]
    }
  }
  else {
    switch (filter.value?.val) {
      case 'anticipated':
        data.value = (await getAnticipated(
          'shows',
          page.toString(),
        ))
        break
      case 'trakt_recommended':
        data.value = (await getCommunityRecommended(
          'shows',
          page.toString(),
        ))
        break
      case 'recommended':
        if (store.myInfo) {
          data.value = (await getRecommendationsFromMe(
            'shows',
            store.myInfo.user.username,
            page.toString(),
          ))
        }
        break
      case 'trending':
        data.value = (await getTrending(
          'shows',
          page.toString(),
        ))
        break
      default:
        store.updateLoading(true)
        return
    }

    if (data.value) {
    // get show ratings object from local storage
      myShowRatings.value = JSON.parse(
        localStorage.getItem('trakt-vue-show-ratings')!,
      )
      // get images and ratings
      const items = await fetchCardInfo('show', myShowRatings.value)
      if (filter.value.val === 'recommended')
        items.sort((a, b) => a.rank - b.rank)
      else if (filter.value.val === 'trending')
        items.sort((a, b) => Number.parseInt(b.watchers) - Number.parseInt(a.watchers))

      data.value.items = [...items]
    }
  }
  store.updateLoading(true)
}

async function fetchCardInfo(
  mType: string,
  ratingsObj: Trakt.Ratings | null,
): Promise<ShowCardInfo[] | EpisodeCardInfo[]> {
  const getCardInfo = async (item: ShowCardInfo[] | EpisodeCardInfo[]) => {
    if (mType === 'show' && 'show' in item) {
      return await getShowInfoCard(item.show as Trakt.Show)
    }
    else if ('show' in item && 'episode' in item) {
      return await getEpisodeInfoCard(
        item.show,
        item.episode,
      )
    }
  }

  const findMyRating = (item: Trakt.ShowRating | Trakt.EpisodeRating): Trakt.ShowRating | Trakt.EpisodeRating | Trakt.SeasonRating | Trakt.MovieRating | null => {
    if (ratingsObj) {
      ratingsObj.ratings.find((rating: Trakt.ShowRating | Trakt.EpisodeRating | Trakt.SeasonRating | Trakt.MovieRating) => {
        if ('show' in rating && 'show' in item) {
          return (
            rating.show.ids.trakt === item.show.ids.trakt
          )
        }
        else if ('episode' in rating && 'episode' in item) {
          return rating.episode.ids.trakt === item.episode.ids.trakt
        }
        else {
          return null
        }
      })
    }
    return null
  }

  if (data.value) {
    return await Promise.all(
      data.value.items.map(async (item) => {
        const cardInfo = await getCardInfo(item)
        const myRating = findMyRating(item)
        return { ...item, ...cardInfo, ...myRating }
      }),
    )
  }
  else {
    return []
  }
}

function goToPage(data: { page: number }) {
  router.push({ path: route.path, query: { page: data.page } })
}

onMounted(() => {
  store.updateFilterType('show')

  if (route.params.filter) {
    filter.value
      = store.filterOptions.show.find(
        (f: Filter) => f.val === route.params.filter,
      ) || store.filterOptions.show[0]
    store.updateFilter(filter.value)
  }

  loadData(currentPage.value)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="p-2 grow">
      <CardContainer
        v-if="store.loaded && data"
        :data="data.items"
        :m-type="store.filterType"
        class="rounded-md"
      />
      <Loading v-else />
    </div>
    <footer v-if="store.loaded && data" class="pt-0 p-2">
      <div class="bg-black/50 p-2 rounded-md">
        <Pagination
          :data
          :current-page
          @click="goToPage"
        />
      </div>
    </footer>
  </div>
</template>
