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
import { useStore } from '~/stores/mainStore'

// components
import CardContainer from '~/components/CardContainer.vue'

import type Trakt from '~/api/trakt.types'
import type { Filter } from '~/stores/mainStore.types'
import type { CardInfo } from '~/api/combinedCall.types'

const route = useRoute()
const router = useRouter()
const store = useStore()

// refs
const data: Ref<Trakt.EpisodeData | null> = ref(null)
const filter: Ref<Filter> = ref(store.filter)
const maxPages: Ref<number> = ref(10)
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
        page.toString(),
      )) as Trakt.EpisodeData

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
        data.value = (await getAnticipated(
          'shows',
          page.toString(),
        )) as Trakt.ShowData
        break
      case 'trakt_recommended':
        data.value = (await getCommunityRecommended(
          'shows',
          page.toString(),
        )) as Trakt.ShowData
        break
      case 'recommended':
        if (store.myInfo) {
          data.value = (await getRecommendationsFromMe(
            'shows',
            store.myInfo.user.username,
            page.toString(),
          )) as Trakt.ShowData
        }
        break
      case 'trending':
        data.value = (await getTrending(
          'shows',
          page.toString(),
        )) as Trakt.ShowData
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

async function fetchCardInfo(
  mType: string,
  ratingsObj: Trakt.Ratings | null,
): Promise<CardInfo> {
  const getCardInfo = async (item) => {
    if (mType === 'show') {
      return await getShowInfoCard(item.show as Trakt.Show)
    }
    else {
      return await getEpisodeInfoCard(
        item.show as Trakt.Show,
        item.episode as Trakt.Episode,
      )
    }
  }

  const findMyRating = (item: any) => {
    return (
      ratingsObj?.ratings.find((rating) => {
        if (mType === 'show') {
          return (
            !('episode' in rating)
            && rating.show.ids.trakt === item.show.ids.trakt
          )
        }
        else {
          return rating.episode.ids.trakt === item.episode.ids.trakt
        }
      }) || { my_rating: null }
    )
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

function pageRange(start: number, end: number) {
  const result: number[] = []
  for (let i = start; i <= end; i++) result.push(i)

  return result
}
function goToPage(data: { page: number }) {
  console.log(data.page)
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

const minPage = computed(() => Math.max(currentPage.value - 3, 1))
const maxPage = computed(() =>
  Math.min(currentPage.value + 3, data.value?.pagesTotal),
)
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
      <LoaderFingers v-else />
    </div>
    <footer class="pt-0 p-2">
      <div class="bg-black/50 p-2 rounded-md">
        <Pagination
          :data
          :current-page
          :animation-duration="duration"
          @click="goToPage"
        />
        <!-- <div class="flex justify-center">
          <div class="flex w-full justify-center ">
            <div class="flex items-end text-lg ">
              <button class="h-11 w-11 mx-1 rounded-md hover:bg-white/20" :class="{ disabled: currentPage === 1 }" @click="goToPage(currentPage - 1, currentPage === 1)">
                <iconify-icon icon="mdi:chevron-left" height="2.5em" width="2.5em" />
              </button>

              <button v-if="minPage > 1" class="h-11 w-11 mx-1 rounded-md hover:bg-white/20" @click="goToPage(1)">
                1
              </button>

              <button v-if="minPage - 1 > 1" class="h-11 w-11 mx-1 rounded-md hover:bg-white/20" @click="goToPage(Math.max(currentPage - 10, 1))">
                ...
              </button>

              <template v-for="page in pageRange(minPage, maxPage)" :key="page">
                <div v-if="currentPage === page" class="h-11 w-11 mx-1 rounded-md bg-pprimary font-bold text-dark flex justify-center items-center">
                  {{ page }}
                </div>
                <button v-else class="h-11 w-11 mx-1 rounded-md" :class="[currentPage === page ? 'bg-pprimary text-slate-900 font-bold' : 'hover:bg-white/20']" @click="goToPage(page)">
                  {{ page }}
                </button>
              </template>

              <button v-if="maxPage < data?.pagesTotal" class="h-11 w-11 mx-1 rounded-md hover:bg-white/20" @click="goToPage(Math.min(currentPage + 10, data?.pagesTotal))">
                ...
              </button>

              <button v-if="maxPage + 1 < data?.pagesTotal" class="h-11 w-11 mx-1 rounded-md hover:bg-white/20" @click="goToPage(data?.pagesTotal)">
                {{ data?.pagesTotal }}
              </button>

              <button class="h-11 w-11 mx-1 rounded-md hover:bg-white/20" :class="{ disabled: currentPage === data?.pagesTotal }" @click="goToPage(currentPage + 1, currentPage === data?.pagesTotal)">
                <iconify-icon icon="mdi:chevron-right" height="2.5em" width="2.5em" />
              </button>
            </div>
          </div>
        </div>
        -->
      </div>
    </footer>
  </div>
</template>
