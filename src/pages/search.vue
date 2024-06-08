<script setup lang="ts">
// api
import { useRoute, useRouter } from 'vue-router'
import { getSearchResults } from '~/api/tmdb'

// store
import { useStore } from '~/stores/mainStore'

// components
import ItemCardContainer from '~/components/ItemCardContainer.vue'
import ItemCard from '~/components/ItemCard.vue'

const store = useStore()
const route = useRoute()
const router = useRouter()

// refs
const searchPage = ref(1)
const searchResults = ref(null)
const searchTerm = ref(null)
const loaded = ref(false)
const currentPage: Ref<number> = ref(
  Number.parseInt(route.query.page as string) || 1,
)

watch(
  () => route.query.page,
  async (newPage) => {
    currentPage.value = Number.parseInt(newPage as string)
    store.updatePage(currentPage.value)
    await getData()
  },
)

watch(
  () => route.params.term,
  async () => {
    await getData()
  },
)

// methods
async function getData() {
  store.updateLoading(false)
  searchResults.value = await getSearchResults(
    route.params.term,
    currentPage.value,
  )
  console.log(searchResults.value)
  store.updateLoading(true)
}
async function goToDetails(item) {
  const mType = item.media_type === 'tv' ? 'show' : 'movie'
  router.push({
    name: mType === 'show' ? 'show-details' : 'movie-details',
    params: {
      [mType]: item.ids.slug,
    },
  })
}
function handleRemoveTerm(term: string) {
  searchTerm.value = searchTerm.value
    .split(' ')
    .filter((word: string) => word !== term)
    .join(' ')
  router.push({ name: 'search', params: { term: searchTerm.value } })
}
function changePage(page: number) {
  router.push({ path: route.path, query: { page } })
  // loadData();
  // store.updatePage(this.page);
  // router.replace({ query: { page: this.page } });
  // localStorage.setItem('trakt-vue-page', page.value);
  // window.scrollTo(0, 0);
}
// function backgroundGradient() {
//   return `linear-gradient(to top right, rgba(0,0,0,.8), rgba(0,0,0,.5) 70%, rgba(0,0,0,.3)),
//      linear-gradient(to top      , rgba(0,0,0,.5), rgba(0,0,0,.2) 70%, rgba(0,0,0,0)),
//      linear-gradient(to right    , rgba(0,0,0,.5), rgba(0,0,0,.2) 70%, rgba(0,0,0,0)),`;
// }

// lifecycle methods
onMounted(async () => {
  store.$subscribe((mutated, state) => {
    searchPage.value = state.searchPage
    loaded.value = state.loaded
  })
  searchTerm.value = route.params.term
  await getData()
})
onUpdated(async () => {
  if (route.params.term !== searchTerm.value) {
    searchTerm.value = route.params.term
    await getData()
  }
})
</script>

<template>
  <div class="h-full w-full p-2 flex flex-col">
    <div class="flex-grow">
      <ScrollArea v-if="loaded">
        <div class="p-2">
          <div class="flex items-center">
            <Badge
              v-for="term in searchTerm.split(' ')"
              :key="term"
              class="flex items-center text-xl px-2 py-1 mb-2 mr-2"
            >
              {{ term }}
              <button @click="handleRemoveTerm(term)">
                <iconify-icon icon="fontisto:close" width=".9em" height=".9em" class="pl-1" />
              </button>
            </Badge>
          </div>

          <ItemCardContainer v-if="searchResults.results?.length > 0">
            <ItemCard
              v-for="result in searchResults.results"
              :key="result.id"
              :title="result.media_type === 'tv' ? result.name : result.title"
              :media-type="result.media_type === 'tv' ? 'tv' : 'movie'"
              :poster="result.poster_path"
              :backdrop="result.backdrop_path"
              :overview="result.overview"
              @click="goToDetails(result)"
            />
          </ItemCardContainer>
          <div v-else>
            No results found for "{{ searchTerm }}"
          </div>
        </div>
      </ScrollArea>
      <Loading v-else />
    </div>

    <footer class="pt-2">
      <div class="bg-black/50 p-2 rounded-md">
        <Pagination
          v-if="searchResults"
          :data="searchResults"
          :current-page="searchResults.page"
          @click="changePage"
        />
      </div>
    </footer>
  </div>
</template>
