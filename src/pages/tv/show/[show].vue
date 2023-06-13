<script setup lang="ts">
import type { Ref } from 'vue'
import dayjs from 'dayjs'
import type { ShowDetails } from '~/api/combinedCall.types'
import type Tmdb from '~/api/tmdb.types'

// store
import { useStore } from '~/store/index'

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
const seasonLength = computed(() => info.value.tmdb_data.seasons.filter(
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

  info.value = await getShowDetails(store.currentIds?.trakt ? store.currentIds.trakt : route.params.show as string)
  arrDetails.value = [
    { label: 'status', value: info.value.tmdb_data.status },
    { label: 'seasons', value: info.value.tmdb_data.number_of_seasons },
    { label: 'episodes', value: info.value.tmdb_data.number_of_episodes },
    { label: 'premiered', value: formattedDate(info.value.tmdb_data.first_air_date) },
    { label: 'runtime', value: `${info.value.runtime} minutes` },
    { label: 'genres', value: genreListString },
    { label: 'country', value: info.value.tmdb_data.origin_country[0].toUpperCase() },
    { label: 'network', value: info.value.network },
    { label: 'languages', value: languageListString },
  ]
  seasons.value = [...info.value.tmdb_data.seasons]
  // set watched progress for each season and add delay (animation)
  if (info.value.watched_progress) {
    info.value.watched_progress.seasons?.forEach((season, index) => {
      if (seasons.value[index]) {
        const delay = season.number > 1 ? season.number * 200 + 500 : 500
        seasons.value[index].watched_progress = 0

        useTimeoutFn(() => {
          seasons.value[index].watched_progress = season.completed / season.aired
          seasons.value[
            index
          ].watched_percent = `${season.completed} out of ${season.aired} watched`
        }, delay)
      }
    })
  }
  store.updateLoading(true)
}

function formattedDate(wDate: string) {
  return dayjs(wDate).format('MMM DD, YYYY')
}

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
    :sub-title="info.year"
    :poster="info.show_poster"
    :technical-details="arrDetails"
    :link-ids="info.ids"
    type="show"
  >
    <template #show-seasons>
      <div class="q-mt-lg">
        <h2>
          {{ seasonLength }}
          {{ seasonLength > 1 ? 'Seasons' : 'Season' }}
        </h2>
        <div class="seasons">
          <div v-for="(season, index) in seasons" :key="season.id">
            <router-link
              class="relative-position"
              :to="{
                path: `/tv/show/${info.ids.slug}/season/${season.season_number}`,
              }"
            >
              <q-img width="150px" :ratio="1 / 1.5" :src="season.poster_path" :alt="season.name" class="season-poster">
                <div v-if="user && season.name.toLowerCase() !== 'specials'" class="season-watched">
                  <q-knob
                    readonly
                    :max="1"
                    :model-value="seasons[index]?.watched_progress"
                    show-value
                    size="30px"
                    :thickness="0.2"
                    color="secondary"
                    track-color="grey-9"
                    class="text-white"
                  >
                    <q-icon name="o_check_circle_outline" size="xs" color="positive" />
                  </q-knob>
                  <q-tooltip>
                    {{ seasons[index]?.watched_percent }}
                  </q-tooltip>
                </div>
                <div class="season-caption absolute-bottom">
                  <div class="caption-text">
                    {{ season.name }}
                  </div>
                </div>
              </q-img>
            </router-link>
          </div>
        </div>
      </div>
    </template>
  </DetailsTemplate>
</template>

<style lang="scss" scoped>
@import '~/quasar-variables.scss';

.seasons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 25px;
  & :deep(.q-img) {
    border-radius: 5px;
  }
  & .season-caption {
    font-size: 0.85em;
    padding: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  & .season-watched {
    padding: 5px;
    position: absolute;
    top: 5px;
    right: 5px;
    border-radius: 5px;
  }
  & .season-poster {
    & .season-caption {
      padding: 0;
      font-weight: bold;
      font-size: 0.9em;
      height: 0;
      transition: height 200ms ease-in-out 100ms;
      & > .caption-text {
        position: absolute;
        padding: 0.6em;
        left: -150px;
        opacity: 0;
        transition: opacity 200ms ease-in-out 0ms, left 200ms ease-in-out 50ms;
      }
    }
    &:hover {
      & .season-caption {
        height: 34px;
        transition: height 200ms ease-in-out;
        & .caption-text {
          left: 0;
          opacity: 1;
          transition: opacity 200ms ease-in-out 200ms, left 200ms ease-in-out 100ms;
        }
      }
    }
  }
}
</style>
