<script setup lang="ts">
import { useQuasar } from 'quasar'
import dayjs from 'dayjs'
import fallBackImg from '~/assets/fallback-tv.jpg'

interface Props {
  title: string
  poster?: string
  backdrop?: string
  mediaType?: string
  overview: string
  aired?: string
  episode: boolean
  mediaLength: string
  watched: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mediaType: 'tv',
  episode: false,
})

defineEmits(['click'])

const $q = useQuasar()

// data
const fallbackImage = fallBackImg

// methods
function formattedDate(wDate: string) {
  return dayjs(wDate).format('MMM DD, YYYY')
}
function backgroundGradient() {
  return `linear-gradient(to top right, rgba(0,0,0,.8), rgba(0,0,0,.5) 70%, rgba(0,0,0,.3)),
         linear-gradient(to top      , rgba(0,0,0,.5), rgba(0,0,0,.2) 70%, rgba(0,0,0,0)),
         linear-gradient(to right    , rgba(0,0,0,.5), rgba(0,0,0,.2) 70%, rgba(0,0,0,0)),`
}
</script>

<template>
  <button class="text-left ma-1" @click="$emit('click')">
    <div
      class="card"
      :style="{
        backgroundImage: `${backgroundGradient()} ${
          backdrop ? `url(https://image.tmdb.org/t/p/w1280/${props.backdrop})` : ''
        }`,
      }"
    >
      <div v-if="$q.screen.gt.sm" class="card-image">
        <q-img
          v-if="props.poster"
          height="100%"
          :width="props.episode ? '250px' : '133px'"
          :ratio="props.episode ? 16 / 9 : 1 / 1.5"
          :src="`https://image.tmdb.org/t/p/w500/${props.poster}`"
          :alt="title"
        >
          <q-icon v-if="props.watched" name="o_check_circle_outline" size="sm" color="positive" class="m-2" />
        </q-img>
        <q-img
          v-else
          :width="props.episode ? '250px' : '133px'"
          :ratio="props.episode ? 16 / 9 : 1 / 1.5"
          :src="fallbackImage"
          alt="generic poster"
        >
          <q-icon v-if="props.watched" name="o_check_circle_outline" size="sm" color="positive" class="m-2" />
        </q-img>
      </div>
      <div class="q-pa-md no-wrap card-content">
        <h1 class="title">
          {{ props.title }}
        </h1>
        <h2 v-if="props.mediaType && !props.episode">
          {{ props.mediaType === 'tv' ? 'TV Show' : 'Movie' }}
        </h2>
        <p v-if="props.aired" class="q-mb-1">
          {{ formattedDate(props.aired) }}
          <span v-if="props.episode">
            - <i>{{ props.mediaLength }} mins</i>
          </span>
        </p>
        <p class="q-mb-none truncate-text">
          {{ props.overview }}
        </p>
      </div>
    </div>
  </button>
</template>

<style lang="scss" scoped>
@import '~/quasar-variables.scss';

h2 {
  font-size: 20px;
}
.title {
  @include text-ellipsis;
  margin-top: 0;
}
button {
  background: none;
  border: none;
  padding: 0;
  min-width: 0;
}
.card {
  height: 200px;
  width: 100%;
  @include background-style;
  overflow: hidden;
  color: white;
  background-position: top center;
  background-size: cover;
  border: none;
  padding: 0;
  display: flex;
  // border: 1px solid transparent;
  & .card-content {
    min-width: 0;
  }
  &:hover {
    outline: 1px solid orange;
  }
}
.truncate-text {
  overflow: hidden;
  display: -webkit-box !important;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  white-space: normal;
}
</style>
