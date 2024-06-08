<script setup lang="ts">
import type { Ref } from 'vue'
import dayjs from 'dayjs'
import type { MovieDetails } from '~/api/combinedCall.types'
// store
import { useStore } from '~/stores/mainStore'
// api
import { getMovieDetails } from '~/api/combinedCalls'
// components
import DetailsTemplate from '~/components/DetailsTemplate.vue'
import MovieCollection from '~/components/MovieCollection.vue'

interface detailsType {
  label: string
  value: any
}

const store = useStore()
const route = useRoute()

const info: Ref<MovieDetails> = ref({} as MovieDetails)
const arrDetails: Ref<detailsType[]> = ref([])
const loaded = ref(false)
const user = ref(JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user)

store.$subscribe((mutated, state) => {
  loaded.value = state.loaded
})

// computed
const languageListString = computed(() => {
  const langs = info.value.tmdb_data.spoken_languages
  let strLang = ''
  for (let i = 0; i < langs.length; i += 1)
    strLang += `${langs[i].english_name}${i !== langs.length - 1 ? ', ' : ''}`

  return strLang
})
const PCListString = computed(() => {
  const pcs = info.value.tmdb_data.production_companies
  let strPC = ''
  for (let i = 0; i < pcs.length; i += 1)
    strPC += `${pcs[i].name}${i !== pcs.length - 1 ? ', ' : ''}`

  return strPC
})

// methods
async function getData() {
  store.updateLoading(false)

  info.value = await getMovieDetails(route.params.movie as string)
  arrDetails.value = [
    { label: 'runtime', value: `${info.value.runtime} minutes` },
    { label: 'released', value: `${formattedDate(info.value.released)}` },
    { label: 'country', value: info.value.country?.toUpperCase() },
    { label: 'languages', value: languageListString },
    {
      label: 'budget',
      value: info.value.tmdb_data.budget
        ? new Intl.NumberFormat('en-CA', {
          style: 'currency',
          maximumFractionDigits: 0,
          currency: 'CAD',
        }).format(info.value.tmdb_data.budget)
        : null,
    },
    {
      label: 'revenue',
      value: info.value.tmdb_data.revenue
        ? new Intl.NumberFormat('en-CA', {
          style: 'currency',
          maximumFractionDigits: 0,
          currency: 'CAD',
        }).format(info.value.tmdb_data.revenue)
        : null,
    },
    { label: 'production companies', value: PCListString },
  ]

  store.updateLoading(true)
}
function formattedDate(wDate: string) {
  return dayjs(wDate).format('MMM DD, YYYY')
}

// lifecycle methods
onMounted(async () => {
  store.$subscribe((mutated, state) => {
    loaded.value = state.loaded
  })

  store.updateLoading(false)
  store.updateFilterType('movie')

  await getData()

  store.updateLoading(true)
})
onUpdated(async () => {
  if (info.value && route.params.movie) {
    const params = route.params.movie
    const movieId = info.value.ids.slug
    if (movieId !== params)
      await getData()
  }
})
</script>

<template>
  <DetailsTemplate
    v-if="loaded"
    :info="info"
    :poster="info.poster"
    :title="info.title"
    :year="info.year"
    :technical-details="arrDetails"
    :link-ids="info.ids"
    type="movie"
  >
    <template #movie-collection>
      <MovieCollection
        v-if="info.tmdb_data.belongs_to_collection?.id"
        :movie="info"
        :collection-id="info.tmdb_data.belongs_to_collection?.id"
        class="mt-6"
      />
    </template>
  </DetailsTemplate>
</template>
