<script setup lang="ts">
// api
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { getSearchResults } from '~/api/tmdb'

// store
import { useStore } from '~/stores/mainStore'

// components
import ItemCardContainer from '~/components/ItemCardContainer.vue'
import ItemCard from '~/components/ItemCard.vue'

const store = useStore()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()

// data
const searchPage = ref(1)
const searchResults = ref(null)
const searchTerm = ref(null)
const loaded = ref(false)

// computed
const screenGreaterThan = computed(() => {
  return $q.screen.gt
})

// methods
async function getData() {
  store.updateLoading(false)
  searchResults.value = await getSearchResults(
    route.params.term,
    searchPage.value,
  )
  setTimeout(() => {
    store.updateLoading(true)
  }, 1000)
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
function changePage() {
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
  <div v-if="loaded" class="search-container">
    <div>
      <div class="flex items-center q-mb-sm q-mt-xs">
        <h1 class="search-heading">
          Search:
        </h1>
        <q-chip
          v-for="term in searchTerm.split(' ')"
          :key="term"
          :label="term"
          size="md"
          color="secondary"
          class="text-capitalize p-4 pl-2 rounded-2"
          :removable="searchTerm.split(' ').length > 1"
          outline
          square
          :ripple="false"
          @remove="handleRemoveTerm(term)"
        />
      </div>
      <q-scroll-area :thumb-style="{ opacity: 0.5 }" class="scroll-container">
        <ItemCardContainer v-if="searchResults?.length > 0">
          <ItemCard
            v-for="result in searchResults"
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
      </q-scroll-area>
    </div>
  </div>
  <q-footer v-if="loaded && store?.pagesTotal > 1" class="text-white footer">
    <q-toolbar class="flex flex-center">
      <q-pagination
        v-model="page"
        color="secondary"
        active-color="secondary"
        outline
        :max="store?.pagesTotal"
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
@use "sass:map";
@import "~/quasar-variables.scss";

h1 {
  font-size: 1.5rem;
}
.search-heading {
  margin: 0 map.get($space-sm, x) 0 0;
  @include text-ellipsis;
}
.search-container {
  height: 100%;
  padding: 0 map.get($space-sm, x) map.get($space-sm, x) map.get($space-sm, x);
  width: 100%;
  max-width: 100%;
  & > div {
    height: 100%;
    width: 100%;
    max-width: 100%;
    padding: map.get($space-sm, x);
    @include background-style;
  }
  & .scroll-container {
    height: calc(100% - 60px);
    width: 100%;
    max-width: 100%;
  }
}
.search-result-button {
  background: none;
  border: none;
  margin: 0;
  padding: 0 0 map.get($space-sm, x) 0;
  &:last-child {
    padding-bottom: 0;
  }
  &.pad {
    padding: 0 map.get($space-sm, x) map.get($space-sm, x) 0;
    &:nth-child(2n) {
      padding-right: 0;
    }
    &:nth-last-child(-n + 2) {
      padding-bottom: 0;
    }
  }
}
.search-result {
  height: 200px;
  display: flex;
  @include background-style;
  overflow: hidden;
  color: white;
  background-position: top center;
  background-size: cover;
  border: none;
  padding: 0;
  & img {
    height: 100%;
    max-width: 133px;
    object-fit: cover;
  }
}
.truncate-text {
  overflow: hidden;
  display: -webkit-box !important;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  white-space: normal;
}
.footer {
  padding: 0 map.get($space-sm, x) map.get($space-sm, x) 0;
  background-color: transparent !important;
  padding-left: 0;
  & > div {
    @include background-style;
  }
}
</style>
