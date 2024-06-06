<script setup lang="ts">
import { YoutubeIframe } from '@vue-youtube/component'
import trailerErrorBack from '~/assets/trailer-error.jpg'

const props = defineProps<{
  showTrailer: boolean
  url: string
  fallbackQuery: string
}>()
const emit = defineEmits(['close'])

// static
const trailerHasError: Ref<boolean> = ref(false)

// refs
const trailerVisible: Ref<boolean> = ref(false)
const trailerVideo: Ref<any | null> = ref(null)
const trailerBack: Ref<HTMLElement | null> = ref(null)

function trailerReady(event: any) {
  trailerVideo.value = event.target
}
async function trailerError(err) {
  alert(err)
  // if (trailerUrl.value === props.info.tmdb_data.videos[0]?.key) {
  //   const newTrailer = await axios.get(
  //     `https://youtube.googleapis.com/youtube/v3/search?q=${
  //       props.info.title
  //     }+trailer&type=video&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`,
  //   )
  //   if (newTrailer.status === 200) {
  //     trailerUrl.value = newTrailer.data.items[0].id.videoId
  //   }
  //   else {
  //     trailerVisible.value = true
  //     trailerHasError.value = true
  //   }
  // }
}
function closeTrailerKey(e: KeyboardEvent) {
  if (props.showTrailer && 'key' in e && e.key.toLowerCase() === 'escape') {
    emit('close')
    setTimeout(() => {
      if (trailerVideo.value)
        trailerVideo.value.stopVideo()
    }, 1000)
  }
}
function closeTrailerBlur(e: MouseEvent) {
  if (props.showTrailer && e.target === trailerBack.value) {
    emit('close')
    setTimeout(() => {
      if (trailerVideo.value)
        trailerVideo.value.stopVideo()
    }, 1000)
  }
  e.preventDefault()
}

watch(() => props.showTrailer, () => {
  if (props.showTrailer === true) {
    if (trailerVideo.value)
      trailerVideo.value.playVideo()
    setTimeout(() => {
      trailerVisible.value = true
    }, 300)
  }
  else {
    trailerVisible.value = false
  }
})

onMounted(() => {
  window.addEventListener('keydown', closeTrailerKey)
  window.addEventListener('click', closeTrailerBlur)
})
onUnmounted(() => {
  window.removeEventListener('keydown', closeTrailerKey)
  window.removeEventListener('click', closeTrailerBlur)
})
</script>

<template>
  <Transition name="trailer-fade">
    <div
      v-show="showTrailer"
      class="fixed top-0 bottom-0 left-0 right-0 bg-black/90 z-50"
      role="dialog"
    >
      <div ref="trailerBack" class="flex items-center h-full">
        <div
          class="flex justify-center w-full transition-all duration-1000 ease-in-out"
          :class="trailerVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.85]'"
        >
          <div
            v-if="trailerHasError"
            class="max-w-[1280px] w-full h-full aspect-[16/9] flex justify-center items-center"
            :style="{ backgroundImage: `url(${trailerErrorBack})` }"
          >
            <div class="p-5 rounded-md bg-black/50 text-3xl">
              Oops, trailer crashed. Search YouTube for a trailer
              <a
                :href="`https://youtube.com/results?search_query=${fallbackQuery} trailer`"
                target="_blank"
              >
                here</a>.
            </div>
          </div>
          <YoutubeIframe
            v-else
            :video-id="url"
            @ready="trailerReady"
            @error="trailerError"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>
