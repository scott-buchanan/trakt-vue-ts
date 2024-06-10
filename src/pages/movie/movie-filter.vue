<script setup lang="ts">
import type { Ref } from 'vue'
// api
import {
  getRecommendationsFromMe,
  getTrending,
  getWatchedHistory,
} from '~/api/trakt'
import { getMovieInfoCard } from '~/api/combinedCalls'
// store
import { useStore } from '~/stores/mainStore'
// components
import CardContainer from '~/components/CardContainer.vue'
// types
import type Trakt from '~/api/trakt.types'
import type { Filter } from '~/stores/mainStore.types'
import type { MovieCardInfo } from '~/api/combinedCall.types'

const route = useRoute()
const router = useRouter()
const store = useStore()

// refs
const data: Ref<Trakt.MovieData | null> = ref(null)
const filter: Ref<Filter> = ref(store.filter)
const myMovieRatings: Ref<Trakt.Ratings | null> = ref(null)
const currentPage: Ref<number> = ref(
  Number.parseInt(route.query.page as string) || 1,
)
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

// methods
async function loadData(page: number) {
  store.updateLoading(false)

  switch (filter.value?.val) {
    case 'history':
      data.value = (await getWatchedHistory(
        'movies',
        page,
      )) as Trakt.MovieData
      break
    case 'recommended':
      if (store.myInfo) {
        data.value = await getRecommendationsFromMe(
          'movies',
          store.myInfo.user.username,
          page,
        )
      }
      break
    case 'trending':
      data.value = await getTrending('movies', page)
      break
    default:
      store.updateLoading(true)
      return
  }

  // get movie ratings object from local storage
  myMovieRatings.value = JSON.parse(
    localStorage.getItem('trakt-vue-movie-ratings') || '{}',
  )

  // get images and ratings
  const items: MovieCardInfo[] = await fetchCardInfo(myMovieRatings.value)

  if (filter.value?.val === 'history') {
    items.sort(
      (a, b) =>
        new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime(),
    )
  }
  else if (filter?.value.val === 'trending') {
    items.sort((a, b) => b.watchers - a.watchers)
  }

  data.value.items = [...items]

  store.updateLoading(true)
}
async function fetchCardInfo(
  mType: string,
  ratingsObj: Trakt.Ratings | null,
): Promise<MovieCardInfo[]> {
  const getCardInfo = async (item: MovieCardInfo[]) => {
    if ('movie' in item)
      return await getMovieInfoCard(item.movie as Trakt.Movie)
  }

  const findMyRating = (item: Trakt.MovieRating | null) => {
    if (ratingsObj) {
      ratingsObj.ratings.find((rating: Trakt.MovieRating) => {
        if ('movie' in rating && 'movie' in item) {
          return (
            rating.movie.ids.trakt === item.movie.ids.trakt
          )
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

function goToPage(page: number) {
  router.push({ path: route.path, query: { page } })
}

// lifecycle methods
onMounted(() => {
  store.updateFilterType('movie')

  const foundFilter = store.filterOptions.show.find(
    filter => filter.val === route.params?.filter,
  )
  if (foundFilter)
    store.updateFilter(foundFilter)

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
    </div>
    <footer v-if="data" class="pt-0 p-2">
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
