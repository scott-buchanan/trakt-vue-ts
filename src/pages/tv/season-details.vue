<script setup lang="ts">
import type { Ref } from 'vue'
import dayjs from 'dayjs'

// store
import { useStore } from '~/stores/mainStore'

// api
import { getSeasonDetails } from '~/api/combinedCalls'

// components
import DetailsTemplate from '~/components/DetailsTemplate.vue'
import ItemCard from '~/components/ItemCard.vue'
import ItemCardContainer from '~/components/ItemCardContainer.vue'

import type { SeasonDetails } from '~/api/combinedCall.types'
import type { TechnicalDetails } from '~/types/types'
import type Tmdb from '~/api/tmdb.types'

const route = useRoute()
const router = useRouter()
const store = useStore()
const arrDetails: Ref<TechnicalDetails[]> = ref([])
const loaded: Ref<boolean> = ref(false)
const info: Ref<SeasonDetails> = ref({} as SeasonDetails)

store.$subscribe((mutated, state) => {
  loaded.value = state.loaded
})

// computed
const unairedEpisodes = computed(() => {
  let count = 0
  info.value.tmdb_data?.episodes.forEach((episode) => {
    if (new Date(episode.air_date) > new Date())
      count += 1
  })
  return count
})

// methods
function episodeTitle(episode: Tmdb.EpisodeDetails) {
  return `${episode.season_number}x${String(episode.episode_number).padStart(
    2,
    '0',
  )} ${episode.name}`
}
function isBeforeToday(episodeDate: string) {
  return new Date(episodeDate) < new Date()
}
async function getData() {
  store.updateLoading(false)

  const { show, season } = route.params
  info.value = await getSeasonDetails(
    show as string,
    Number.parseInt(season as string, 10),
  )
  arrDetails.value = [
    { label: 'aired', value: formattedDate(info.value.tmdb_data.air_date) },
    { label: 'network', value: info.value.network },
  ]

  store.updateLoading(true)
}
function handleEpisodeClick(episode: Tmdb.EpisodeDetails) {
  router.push({
    path: `/tv/show/${info.value.show.ids.slug}/season/${episode.season_number}/episode/${episode.episode_number}`,
  })
}
function formattedDate(wDate: string) {
  return dayjs(wDate).format('MMM DD, YYYY')
}

// lifecycle hooks
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
    :sub-title="info.tmdb_data.name"
    :poster="info.tmdb_data.poster_path"
    :technical-details="arrDetails"
    :link-ids="info.show.ids"
    type="season"
  >
    <template #season-episode-list>
      <div class="mt-5">
        <h1>
          {{ info.tmdb_data?.episodes.length }} Episodes
          <small v-if="unairedEpisodes > 0">
            ({{ unairedEpisodes }} unaired episodes)
          </small>
        </h1>
        <ItemCardContainer>
          <ItemCard
            v-for="episode in info.tmdb_data?.episodes"
            v-show="isBeforeToday(episode.air_date)"
            :key="episode.name"
            episode
            :title="episodeTitle(episode)"
            :poster="episode.backdrop.backdrop_sm"
            :overview="episode.overview"
            :aired="episode.air_date"
            :backdrop="episode.backdrop.backdrop_lg"
            :media-length="episode.runtime"
            @click="handleEpisodeClick(episode)"
          />
        </ItemCardContainer>
      </div>
    </template>
  </DetailsTemplate>
</template>
