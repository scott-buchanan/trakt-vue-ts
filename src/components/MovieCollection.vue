<script setup lang="ts">
import { onMounted, ref } from 'vue'

// api
import { getMovieCollection } from '~/api/combinedCalls'

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

const info = ref(null)

onMounted(async () => {
  info.value = await getMovieCollection(props.collectionId)
})
</script>

<template>
  <div v-if="info?.parts.length > 1" class="q-mt-lg">
    <h2>{{ info.name }}</h2>
    <div class="posters wrap">
      <div v-for="item, index in info.parts" :key="item.release_date">
        <q-img
          v-if="movie.ids.tmdb === item.id"
          :src="item.poster_path"
          :alt="item.title"
          :ratio="1 / 1.5"
          width="150px"
          class="poster current"
          :class="{ 'q-ml-xs': index === 0 }"
        >
          <div v-if="item.watched_progress" class="poster-watched">
            <q-icon name="o_check_circle_outline" size="sm" color="positive" />
          </div>
        </q-img>
        <router-link v-else :to="{ name: 'movie-details', params: { movie: item.slug } }">
          <q-img
            :src="item.poster_path"
            :alt="item.title"
            :ratio="1 / 1.5"
            width="150px"
            class="poster"
          >
            <div v-if="item.watched_progress" class="poster-watched">
              <q-icon name="o_check_circle_outline" size="sm" color="positive" />
            </div>
          </q-img>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:map';

h2 {
  all: revert;
  /* margin: 0 0 map.get($space-sm, x) 0; */
}
.posters {
  display: flex;
  gap: 10px;
  & .poster {
    border-radius: 5px;
    &.current {
      /* outline: 3px solid $secondary; */
    }
    & .poster-watched {
      position: absolute;
      top: 5px;
      right: 5px;
      padding: 5px;
      border-radius: 5px;
    }
  }
}
</style>
