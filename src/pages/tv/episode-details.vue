<script setup lang="ts">
import dayjs from 'dayjs'

// store
import type { Ref } from 'vue'
import { useStore } from '~/store/index'

// api
import { getEpisodeDetails } from '~/api/combinedCalls'

// components
import DetailsTemplate from '~/components/DetailsTemplate.vue'
import type { TechnicalDetails } from '~/types/types'
import type { EpisodeDetails } from '~/api/combinedCall.types'

// data
const route = useRoute()
const store = useStore()
const info: Ref<EpisodeDetails> = ref({} as EpisodeDetails)
const arrDetails: Ref<TechnicalDetails[]> = ref([])

const episodeTitle = computed(() => `${info.value.season}x${info.value.number.toString().padStart(2, '0')} ${
  info.value.title
  }`)

function formattedDate(wDate: string) {
  return dayjs(wDate).format('MMM DD, YYYY')
}

onMounted(async () => {
  store.updateLoading(false)
  store.updateFilterType('show')
  store.updateFilter({ label: null, val: null, auth: null })

  info.value = await getEpisodeDetails(
    store.currentIds?.trakt ? store.currentIds?.trakt : route.params.show.toString(),
    route.params.season.toString(),
    route.params.episode.toString(),
  )
  arrDetails.value = [
    { label: 'runtime', value: `${info.value.runtime} minutes` },
    { label: 'aired', value: formattedDate(info.value.first_aired) },
  ]
  store.updateLoading(true)
})
</script>

<template>
  <DetailsTemplate
    v-if="store.loaded"
    :info="info"
    :title="info.show.title"
    :sub-title="episodeTitle"
    :poster="info.season_poster"
    :technical-details="arrDetails"
    :link-ids="info.show.ids"
    type="episode"
  />
</template>
