<script setup lang="ts">
import type { Ref } from 'vue'
// api
import { rateEpisode, rateMovie, rateSeason, rateShow } from '~/api/trakt'
import type Trakt from '~/api/trakt.types'

const props = withDefaults(defineProps<{
  rating: number | null
  item: Trakt.Show | Trakt.Season | Trakt.Episode | Trakt.Movie
  type: string
}>(), {
  rating: null,
})

// refs
const showSuccess: Ref<boolean> = ref(false)
const ratingPopOpen: Ref<boolean> = ref(false)
const user: Ref<Trakt.User> = ref(
  JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user,
)
const myRating: Ref<number> = ref(0)
const ratingTimeoutId: Ref<ReturnType<typeof setTimeout> | null> = ref(null)
const ratingHover: Ref<boolean> = ref(false)

// methods
function openRatingPopup(delay = false) {
  clearTimeout(ratingTimeoutId.value!)
  setTimeout(
    () => {
      ratingPopOpen.value = true
    },
    delay ? 300 : 0,
  )
}
function closeRatingPopup(delay = false) {
  if (ratingHover.value === false) {
    ratingTimeoutId.value = setTimeout(
      () => {
        ratingPopOpen.value = false
      },
      delay ? 500 : 0,
    )
  }
}
async function rate(number: number) {
  let success: boolean
  switch (props.type) {
    case 'episode':
      success = await rateEpisode(props.item as Trakt.Episode, number)
      break
    case 'show':
      success = await rateShow(props.item as Trakt.Show, number)
      break
    case 'season':
      success = await rateSeason(props.item as Trakt.Season, number)
      break
    default:
      // movie
      success = await rateMovie(props.item as Trakt.Movie, number)
  }

  if (success) {
    myRating.value = number
    showSuccess.value = true
    ratingPopOpen.value = false
  }
}

function hover(value: boolean) {
  ratingHover.value = value
}

function closeToast() {
  showSuccess.value = false
}

onMounted(() => {
  myRating.value = props.rating === null ? 0 : props.rating
})
</script>

<template>
  <div v-if="user" class="relative">
    <div
      v-if="myRating"
      class="flex items-center"
      @mouseenter="openRatingPopup(true)"
      @mouseleave="closeRatingPopup(true)"
      @focus="openRatingPopup(true)"
      @blur="closeRatingPopup(true)"
    >
      <img
        :src="user.images.avatar.full"
        :alt="user.name"
        referrerpolicy="no-referrer"
        class="w-9 rounded-full"
      >

      <div class="rating">
        <div class="text-2xl mx-2 font-extralight">
          {{ myRating === 10 ? myRating : myRating.toFixed(1) }}
        </div>
      </div>
    </div>
    <Button
      v-else
      id="btnRate"
      class="p-3 rounded-md"
      @click="openRatingPopup()"
    >
      Rate
    </Button>

    <Transition name="slide-up">
      <div
        v-if="ratingPopOpen"
        class="flex p-2 absolute top-10 left-1/2 -translate-x-1/2 bg-black/50 rounded-xl"
        :class="myRating ? 'w-[22rem]' : 'w-80'"
        @mouseover="hover(true)"
        @mouseleave="hover(false)"
      >
        <button v-if="myRating" class="w-8 h-8" @click="rate(0)">
          <iconify-icon
            icon="mdi-star-off-outline"
            width="100%"
            height="100%"
            class="p-1 text-zinc-400 transition-transform ease-linear hover:scale-125"
          />
        </button>
        <button v-for="number in 10" :key="number" class="w-8 h-8" @click="rate(number)">
          <iconify-icon
            :icon="myRating >= number ? 'mdi:star' : 'mdi:star-outline'"
            width="100%"
            height="100%"
            class="p-1 text-yellow-400 transition-transform ease-linear hover:scale-125"
          />
        </button>
      </div>
    </Transition>

    <ToastMessage message="Successfully rated!" :show-message="showSuccess" @close="closeToast" />
  </div>
</template>
