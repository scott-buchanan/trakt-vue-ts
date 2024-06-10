<script setup lang="ts">
import { onMounted, ref } from 'vue'

// api
import { getMovieCollection } from '~/api/combinedCalls'
import type Tmdb from '~/api/tmdb.types'

const props = defineProps({
  movie: {
    type: Object,
    required: true,
  },
  collectionId: {
    type: Number,
    required: true,
  },
})

const info: Ref<Tmdb.Collection | null> = ref(null)

onMounted(async () => {
  info.value = await getMovieCollection(props.collectionId)
})
</script>

<template>
  <div v-if="info?.parts && info.parts.length > 1" class="mt-6">
    <h2>{{ info.name }}</h2>
    <div class="flex gap-3">
      <div v-for="item in info?.parts" :key="item.release_date">
        <div v-if="movie.ids.tmdb === item.id" class="relative">
          <img
            :src="item.poster_path"
            :alt="item.title"
            class="w-36 rounded-md"
          >
          <div v-if="item.watched_progress" class="absolute top-1 right-1 bg-black/50 rounded-md p-2">
            <iconify-icon icon="fa:check" width="2em" height="2em" class="text-green-500" />
          </div>
        </div>
        <router-link v-else :to="{ name: 'movie-details', params: { movie: item.slug } }" class="relative">
          <img
            :src="item.poster_path"
            :alt="item.title"
            class="w-36 rounded-md"
          >
          <div v-if="item.watched_progress" class="absolute top-1 right-1 bg-black/50 rounded-md p-2">
            <iconify-icon icon="fa:check" width="2em" height="2em" class="text-green-500" />
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>
