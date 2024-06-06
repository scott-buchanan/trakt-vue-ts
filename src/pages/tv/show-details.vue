<script setup lang="ts">
import type { Ref } from 'vue'
import dayjs from 'dayjs'
import type { ShowDetails } from '~/api/combinedCall.types'
import type Tmdb from '~/api/tmdb.types'
// store
import { useStore } from '~/stores/mainStore'
// api
import { getShowDetails } from '~/api/combinedCalls'
// components
import DetailsTemplate from '~/components/DetailsTemplate.vue'

interface detailsType {
  label: string
  value: any
}

// for route param
defineProps<{
  show: string
}>()

const route = useRoute()
const store = useStore()
const info: Ref<ShowDetails> = ref({} as ShowDetails)
const arrDetails: Ref<detailsType[]> = ref([])
const seasons: Ref<Tmdb.Season[]> = ref([])
const loaded = ref(false)
const user = ref(JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user)

store.$subscribe((mutated, state) => {
  loaded.value = state.loaded
})

// computed
const seasonLength = computed(
  () =>
    info.value.tmdb_data.seasons.filter(
      season => season.name.toLowerCase() !== 'specials',
    ).length,
)
const languageListString = computed(() => {
  const langs = info.value.tmdb_data.spoken_languages
  let strLang = ''
  for (let i = 0; i < langs.length; i += 1)
    strLang += `${langs[i].english_name}${i !== langs.length - 1 ? ', ' : ''}`

  return strLang
})
const genreListString = computed(() => {
  const { genres } = info.value.tmdb_data
  let strGenres = ''
  for (let i = 0; i < genres.length; i += 1)
    strGenres += `${genres[i].name}${i !== genres.length - 1 ? ', ' : ''}`

  return strGenres
})

// methods
async function getData() {
  store.updateLoading(false)

  info.value = await getShowDetails(
    store.currentIds?.trakt
      ? store.currentIds.trakt
      : (route.params.show as string),
  )
  arrDetails.value = [
    { label: 'status', value: info.value.tmdb_data.status },
    { label: 'seasons', value: info.value.tmdb_data.number_of_seasons },
    { label: 'episodes', value: info.value.tmdb_data.number_of_episodes },
    {
      label: 'premiered',
      value: formattedDate(info.value.tmdb_data.first_air_date),
    },
    { label: 'runtime', value: `${info.value.runtime} minutes` },
    { label: 'genres', value: genreListString },
    {
      label: 'country',
      value: info.value.tmdb_data.origin_country[0].toUpperCase(),
    },
    { label: 'network', value: info.value.network },
    { label: 'languages', value: languageListString },
  ]
  seasons.value = [...info.value.tmdb_data.seasons]

  // set watched progress for each season and add delay (animation)
  if (info.value.watched_progress) {
    info.value.watched_progress.seasons?.forEach((season, index) => {
      if (seasons.value[index]) {
        seasons.value[index].watched_progress = 0

        seasons.value[index].watched_progress
            = season.completed / season.aired
        seasons.value[
          index
        ].watched_percent = `${season.completed} out of ${season.aired} watched`
      }
    })
  }
  store.updateLoading(true)
}
function formattedDate(wDate: string) {
  return dayjs(wDate).format('MMM DD, YYYY')
}
function watchedProgress(index: number) {
  if (seasons.value[index]?.watched_progress)
    return Math.abs(seasons.value[index]?.watched_progress - 1)

  return 1
}

// lifecycle methods
onMounted(async () => {
  store.updateLoading(false)
  store.updateFilterType('show')

  await getData()

  store.updateLoading(true)
})
</script>

<template>
  <DetailsTemplate
    v-if="loaded"
    :info="info"
    :title="info.title"
    :year="info.year"
    :poster="info.show_poster"
    :technical-details="arrDetails"
    :link-ids="info.ids"
    type="show"
  >
    <template #show-seasons>
      <div class="q-mt-lg">
        <h2>
          {{ seasonLength }}
          {{ seasonLength > 1 ? "Seasons" : "Season" }}
        </h2>
        <div class="flex gap-3 mb-6">
          <div v-for="(season, index) in seasons" :key="season.id">
            <router-link
              :to="{
                path: `/tv/show/${info.ids.slug}/season/${season.season_number}`,
              }"
            >
              <Image
                v-if="season.poster_path"
                :src="season.poster_path"
                :alt="season.name"
                class="rounded-md w-36"
              >
                <div
                  v-if="user && season.name.toLowerCase() !== 'specials' && watchedProgress(index) !== 1"
                  class="absolute top-1 right-1 p-2 rounded-full h-11 w-11 bg-black/50"
                >
                  <iconify-icon icon="fa:check" width="2em" height="2em" class="text-green-500" :style="{ filter: `grayscale(${watchedProgress(index)})` }" />
                  <Tooltip :value="seasons[index]?.watched_percent" />
                </div>
                <div class="absolute bottom-0 bg-black/50 w-full rounded-b-md text-sm p-2 overflow-hidden text-ellipsis whitespace-nowrap">
                  <div class="caption-text">
                    {{ season.name }}
                  </div>
                </div>
              </Image>
            </router-link>
          </div>
        </div>
      </div>
    </template>
    <template #more-like-this>
      <h2>More like this</h2>
    </template>
  </DetailsTemplate>
</template>
