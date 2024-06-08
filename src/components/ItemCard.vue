<script setup lang="ts">
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
  <button
    class="flex flex-nowrap text-left h-52 w-full text-white bg-[center] bg-cover p-0 rounded-md"
    :style="{
      backgroundImage: `${backgroundGradient()} ${
        backdrop ? `url(https://image.tmdb.org/t/p/w1280/${props.backdrop})` : `url(${fallBackImg})`
      }`,
    }" @click="$emit('click')"
  >
    <div class="hidden sm:block">
      <div class="h-full relative">
        <img
          :class="props.episode ? 'w-[250px] aspect-[16/9]' : 'w-[133px] aspect-[1/1.5]'"
          :ratio="props.episode ? 16 / 9 : 1 / 1.5"
          :src="props.poster ? `https://image.tmdb.org/t/p/w500/${props.poster}` : fallBackImg"
          :alt="props.poster ? title : 'generic poster'"
        >
        <iconify-icon
          v-if="props.watched"
          icon="fa:check"
          width="2em"
          height="2em"
          class="absolute top-1 right-1 p-2 bg-black/50 rounded-md text-green-500"
        />
      </div>
    </div>
    <div class="p-4">
      <h1>
        {{ props.title }}
      </h1>
      <h2 v-if="props.mediaType && !props.episode">
        {{ props.mediaType === 'tv' ? 'TV Show' : 'Movie' }}
      </h2>
      <p v-if="props.aired" class="mb-1">
        {{ formattedDate(props.aired) }}
        <span v-if="props.episode">
          - <i>{{ props.mediaLength }} mins</i>
        </span>
      </p>
      <p class="mb-0 truncate-text overflow-hidden line-clamp-3 whitespace-normal">
        {{ props.overview }}
      </p>
    </div>
  </button>
</template>
