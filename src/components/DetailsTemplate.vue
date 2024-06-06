<script setup lang="ts">
import type { Ref } from 'vue'
import { YoutubeIframe } from '@vue-youtube/component'
import axios from 'axios'
import dayjs from 'dayjs'
// store
import Actors from './Actors.vue'
import Rating from './Rating.vue'
import Reviews from './Reviews.vue'
import DarkList from './DarkList.vue'
import Badge from './Badge.vue'
import { useStore } from '~/stores/mainStore'
// components
// assets
import trailerErrorBack from '~/assets/trailer-error.jpg'
import imdb from '~/assets/imdb_tall.png'
import trakt from '~/assets/trakt-icon-red.svg'
import tmdb from '~/assets/tmdb_tall.svg'
// types
import type Trakt from '~/api/trakt.types'
import type { TechnicalDetails } from '~/types/types'
import type {
  EpisodeDetails,
  MovieDetails,
  SeasonDetails,
  ShowDetails,
} from '~/api/combinedCall.types'

const props = defineProps<{
  info: ShowDetails | EpisodeDetails | SeasonDetails | MovieDetails
  title: string
  year: number
  poster: string
  technicalDetails: TechnicalDetails[]
  linkIds: Trakt.Ids
  type?: string
}>()

// data
const store = useStore()
const user: Ref<Trakt.User> = ref(
  JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user,
)
const watchedProgress: Ref<number> = ref(0)
const trailerUrl: Ref<string | null> = ref(null)
const showTrailer: Ref<boolean> = ref(false)
const trailerVisible: Ref<boolean> = ref(false)
const trailerHasError: Ref<boolean> = ref(false)
const seeMoreDetails: Ref<boolean> = ref(false)
const trailer = ref(null)

// computed
const links = computed(() => {
  const linkSeason = 'season' in props.info
  const traktType = props.info.type === 'episode' ? 'trakt' : 'slug'
  const tmdb = () => {
    let strTmdb = `https://themoviedb.org/${
      props.info.type === 'movie' ? props.info.type : 'tv'
    }/${props.linkIds.tmdb}`
    if ('season' in props.info && 'number' in props.info) {
      // episode
      strTmdb += props.info.season ? `/season/${props.info.season}` : ''
      strTmdb
        += props.info.type === 'episode' ? `/episode/${props.info.number}` : ''
    }
    else if ('number' in props.info) {
      // season
      strTmdb += props.info.number ? `/season/${props.info.number}` : ''
    }
    return strTmdb
  }
  const trakt = () => {
    let strTrakt = `https://trakt.tv/${
      props.info.type === 'movie' ? props.info.type : 'show'
    }s/${props.linkIds.slug}`
    if ('season' in props.info && 'number' in props.info) {
      // episode
      strTrakt += `/seasons/${props.info.season}`
      strTrakt += `/episodes/${props.info.number}`
    }
    else if ('number' in props.info) {
      // season
      strTrakt += `/seasons/${props.info.number}`
    }
    return strTrakt
  }
  return {
    imdb: {
      label: 'IMDb',
      value: `https://www.imdb.com/title/${props.linkIds.imdb}${
        linkSeason ? `/episodes?season=${props.info.season}` : ''
      }`,
    },
    tmdb: {
      label: 'TMDb',
      value: tmdb(),
    },
    [traktType]: {
      label: 'Trakt',
      value: trakt(),
    },
  }
})
const detailsBackground = computed(() => {
  return `linear-gradient(to top right, rgba(0,0,0,.8), rgba(0,0,0,.5) 70%, rgba(0,0,0,.3)),
              linear-gradient(to top      , rgba(0,0,0,.5), rgba(0,0,0,.2) 70%, rgba(0,0,0,0)),
              linear-gradient(to right    , rgba(0,0,0,.5), rgba(0,0,0,.2) 70%, rgba(0,0,0,0)),
              url(${props.info?.backdrop.backdrop_lg})`
})
const technicalDetailsFiltered = computed(() =>
  props.technicalDetails.filter(item => item.value),
)
const isTrailerVisible = computed(() => trailerVisible.value)
const isReleased = computed(() => {
  if (store.filterType === 'movie')
    return props.info.tmdb_data.status.toLowerCase() === 'released'
  else return new Date(props.info.tmdb_data.first_air_date) < new Date()
})

// methods
function technicalDetails() {
  return props.technicalDetails.filter(item => item.value)
}
function watchedInfo() {
  const arr = []
  const progress = props.info.watched_progress
  let watchedValue

  if (progress) {
    // add number of episodes watched
    if (progress.aired > 0 && progress.type === 'show') {
      watchedValue = `${progress.completed}/${progress.aired} episodes`
      arr.push({ label: 'watched', value: watchedValue })
    }
    // add last watched date
    if (progress?.last_watched_at) {
      arr.push({
        label: 'last watch',
        value: formattedDateTime(progress.last_watched_at),
      })
    }
    // if movie, add number of plays
    if ('movie' in progress) {
      arr.push({
        label: 'plays',
        value: progress.plays,
      })
    }
  }
  return arr
}
function formattedDateTime(wDate: string) {
  return `${dayjs(wDate).format('MMM DD, YYYY')} at ${dayjs(wDate).format(
    'h:mma',
  )}`
}
function truncateDetails(details: string) {
  return seeMoreDetails.value ? details : details.split(',', 2).toString()
}
function trailerReady(event: any) {
  // useTimeoutFn(() => {
  trailerVisible.value = true
  event.target?.playVideo()
  // }, 500)
}
async function trailerError() {
  if (trailerUrl.value === props.info.tmdb_data.videos[0]?.key) {
    const newTrailer = await axios.get(
      `https://youtube.googleapis.com/youtube/v3/search?q=${
        props.info.title
      }+trailer&type=video&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`,
    )
    if (newTrailer.status === 200) {
      trailerUrl.value = newTrailer.data.items[0].id.videoId
    }
    else {
      trailerVisible.value = true
      trailerHasError.value = true
    }
  }
}
function closeTrailer() {
  showTrailer.value = false
}

onMounted(() => {
  store.updateMenuVisible(false)
  store.updateFilter({ label: null, val: null, auth: null })

  if ('videos' in props.info.tmdb_data)
    trailerUrl.value = props.info.tmdb_data.videos[0]?.key

  // for animation purposes
  if ('watched_progress' in props.info) {
    useTimeoutFn(() => {
      if (props.info.watched_progress) {
        const wp = props.info.watched_progress
        watchedProgress.value = wp.completed! / wp.aired!
      }
    }, 500)
  }
})
</script>

<template>
  <div class="h-full w-full p-2">
    <div
      class="flex-1 bg-cover bg-center h-full rounded-md"
      :style="{
        backgroundImage: detailsBackground,
      }"
    >
      <div class="flex flex-nowrap h-full p-3">
        <div class="hidden md:block static w-5/12 min-w-52 max-w-xl py-3 pl-3">
          <img class="rounded-md" :src="poster" alt="">
        </div>
        <ScrollArea>
          <div>
            <div class="flex">
              <div
                class="block md:hidden float-left pr-3 pb-3"
              >
                <img
                  class="rounded-md min-w-32 w-[16vw]"
                  :src="props.poster"
                  alt=""
                >
              </div>

              <!-- TITLES -->
              <div class="w-full break-words">
                <h1 class="flex text-lg">
                  <span class="mr-4">{{ title }}</span>
                  <span v-if="year" class="font-thin">{{ year }}</span>
                  <div class="p-[6px] text-xs text-pprimary border border-pprimary rounded-md">
                    <span v-if="info.certification">
                      {{ info.certification }}
                    </span>
                  </div>
                </h1>

                <!-- TAGLINE -->
                <p v-if="info.tmdb_data?.tagline" class="text-italic font-light">
                  "{{ info.tmdb_data.tagline }}"
                </p>

                <div v-if="info.tmdb_data?.genres" class="mb-4">
                  <span
                    v-for="genre in info.tmdb_data.genres"
                    :key="genre.id"
                    class="mr-1"
                  >
                    <Badge :value="genre.name" />
                  </span>
                </div>

                <!-- RATINGS -->
                <div class="flex mb-5">
                  <div v-if="isReleased" class="flex flex-wrap">
                    <div v-if="info.imdb_rating" class="flex items-center">
                      <img :src="imdb" alt="IMDb" class="w-9">
                      <div class="text-2xl px-3">
                        {{ info.imdb_rating }}
                      </div>
                    </div>
                    <div v-if="info.trakt_rating && info.trakt_rating !== '0.0'" class="flex items-center">
                      <img :src="trakt" alt="Trakt" class="w-9">
                      <div class="text-2xl px-3">
                        {{ info.trakt_rating }}
                      </div>
                    </div>
                    <div v-if="info.tmdb_rating && info.tmdb_rating !== '0.0'" class="flex items-center">
                      <img :src="tmdb" alt="The Movie DB" class="w-9">
                      <div class="text-2xl px-3">
                        {{ info.tmdb_rating }}
                      </div>
                    </div>
                    <div v-if="isReleased && user" class="flex items-center">
                      <Rating
                        :item="info"
                        :type="props.type"
                        :rating="info.my_rating"
                      />
                    </div>
                    <div v-if="trailerUrl" class="flex items-center">
                      <Button class="p-3 rounded-md" @click="showTrailer = true">
                        Trailer
                      </Button>
                    </div>
                  </div>
                </div>

                <!-- LINKS -->
                <div class="mb-6">
                  <span class="mr-2">Links: </span>
                  <template v-for="(value, key) in linkIds" :key="key">
                    <template v-if="links[key]">
                      <a
                        :href="links[key].value"
                        target="blank"
                        class="mr-3 hover:no-underline"
                      >
                        <Badge :value="links[key].label" outline />
                      </a>
                    </template>
                  </template>
                </div>

                <!-- WATCHED INFO -->
                <DarkList :items="watchedInfo()" stacked />

                <!-- TECHNICAL DETAILS -->
                <DarkList :items="technicalDetails()" />
              </div>
            </div>

            <!-- OVERVIEW -->
            <p v-if="info.tmdb_data.overview" class="text-lg leading-6 mb-0">
              {{ info.tmdb_data.overview }}
            </p>

            <div>
              <!-- MOVIE COLLECTION -->
              <slot name="movie-collection" />
              <!-- SHOW SEASONS -->
              <slot name="show-seasons" />
              <!-- SEASONS EPISODES -->
              <slot name="season-episode-list" />
              <!-- MORE LIKE THIS -->
              <slot name="more-like-this" />

              <Actors
                v-if="info.actors?.length > 0"
                class="block sm:hidden"
                :actors="info.actors"
                horizontal
              />

              <Reviews
                class="mt-6"
                :reviews="info.reviews.comments"
                :review-count="info.reviews.total"
                :m-type="type"
              />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>

    <Actors
      v-if="info.actors?.length > 0"
      class="hidden sm:block"
      :actors="info.actors"
    />
  </div>

  <TrailerModal v-if="trailerUrl" :url="trailerUrl" :fallback-query="info.title" :show-trailer="showTrailer" @close="closeTrailer" />

  <!-- TRAILER this has to come out of this component into app or something. Set showTrailer and trailer url by store -->
<!--  <transition name="fade-scale">
    <div
      v-show="showTrailer"
      class="fade-scale-enter-active fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90"
      role="dialog"
    >
      <div
        v-if="trailerHasError"
        :style="{ backgroundImage: `url(${trailerErrorBack})` }"
      >
        <div class="h-full">
          Oops, trailer crashed. Search YouTube for a trailer
          <a
            :href="`https://www.youtube.com/results?search_query=${info.title} trailer`"
            target="blank"
          >
            here</a>.
        </div>
      </div>
      <div
        v-else
        class="h-full"
      >
        <YoutubeIframe
          ref="trailer"
          :style="{
            width: '100%',
            height: '100%',
          }"
          :video-id="trailerUrl"
          @ready="trailerReady"
          @error="trailerError"
        />
      </div>
    </div>
  </transition> -->

  <!-- <q-dialog
    v-model="showTrailer"
    :transition-duration="500"
    class="trailer"
    @hide="closeTrailer"
  >
    <div class="trailer">
      <div
        v-if="trailerHasError"
        :style="{ backgroundImage: `url(${trailerErrorBack})` }"
      >
        <div class="trailer-error-text">
          Oops, trailer crashed. Search YouTube for a trailer
          <a
            :href="`https://www.youtube.com/results?search_query=${info.title} trailer`"
            target="blank"
          >
            here</a>.
        </div>
      </div>
      <div v-else :style="{ opacity: isTrailerVisible ? 1 : 0 }">
        <YoutubeIframe
          :style="{
            width: '100%',
            height: '100%',
          }"
          :video-id="trailerUrl"
          @ready="trailerReady"
          @error="trailerError"
        />
      </div>
    </div>
  </q-dialog> -->
</template>
