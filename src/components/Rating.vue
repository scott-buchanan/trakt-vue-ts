<script setup lang="ts">
// import { useQuasar } from 'quasar'
import type { Ref } from 'vue'
// api
import { rateEpisode, rateMovie, rateSeason, rateShow } from '~/api/trakt'
import type Trakt from '~/api/trakt.types'

interface Props {
  rating: number | null
  item: Trakt.Show | Trakt.Season | Trakt.Episode | Trakt.Movie
  type: string
}
const props = withDefaults(defineProps<Props>(), {
  rating: null,
})

// const $q = useQuasar()
const ratingPopOpen: Ref<boolean> = ref(false)
const user: Ref<Trakt.User> = ref(
  JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user,
)
const myRating: Ref<number> = ref(0)
const ratingTimeoutId: Ref<ReturnType<typeof setTimeout> | null> = ref(null)

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
  ratingTimeoutId.value = setTimeout(
    () => {
      ratingPopOpen.value = false
    },
    delay ? 500 : 0,
  )
}
async function rate() {
  // let response: boolean
  switch (props.type) {
    case 'episode':
      await rateEpisode(props.item as Trakt.Episode, myRating.value)
      break
    case 'show':
      await rateShow(props.item as Trakt.Show, myRating.value)
      break
    case 'season':
      await rateSeason(props.item as Trakt.Season, myRating.value)
      break
    default:
      // movie
      await rateMovie(props.item as Trakt.Movie, myRating.value)
  }
  // if (response === true) {
  //   $q.notify({
  //     message: 'Rating saved successfully!',
  //     position: 'top',
  //     icon: 'o_done',
  //     iconColor: 'green',
  //     badgeColor: 'secondary',
  //     badgeTextColor: 'dark',
  //     progress: true,
  //     timeout: 2500,
  //   })
  // }
  // else {
  //   $q.notify({
  //     message: 'An error has occurred.',
  //     position: 'top',
  //     icon: 'o_error',
  //     iconColor: 'red',
  //     badgeColor: 'secondary',
  //     badgeTextColor: 'dark',
  //     progress: true,
  //     timeout: 2500,
  //   })
  // }
  closeRatingPopup()
}

onMounted(() => {
  myRating.value = props.rating === null ? 0 : props.rating
})
</script>

<template>
  <div v-if="user">
    <div
      v-if="myRating"
      class="flex"
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
        <div>{{ myRating === 10 ? myRating : myRating.toFixed(1) }}</div>
      </div>
    </div>
    <Button
      v-else
      id="btnRate"
      @click="openRatingPopup()"
    >
      Rate
    </Button>
    <q-menu
      v-model="ratingPopOpen"
      :target="myRating ? '#avatar' : '#btnRate'"
      dark
      transition-show="jump-up"
      transition-hide="jump-down"
      anchor="top middle"
      self="top middle"
      class="q-pa-sm"
      :offset="[0, 50]"
      @focus="openRatingPopup"
      @mouseenter="openRatingPopup"
      @mouseleave="closeRatingPopup(true)"
      @blur="closeRatingPopup"
    >
      <q-rating
        v-model="myRating"
        max="10"
        size="1.5em"
        icon="o_star_border"
        icon-selected="o_star"
        icon-half="o_star_half"
        @update:model-value="rate"
      />
    </q-menu>
  </div>
</template>

<style lang="scss" scoped>
@import "~/quasar-variables.scss";

button {
  font-weight: 600;
}
.rating {
  font-size: 24px;
  margin: 0 10px 0 10px;
}
</style>
