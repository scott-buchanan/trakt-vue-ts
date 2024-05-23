<script setup lang="ts">
import type { Ref } from 'vue'
import { YoutubeIframe } from '@vue-youtube/component'
import axios from 'axios'
import dayjs from 'dayjs'
import { useQuasar } from 'quasar'
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
const $q = useQuasar()
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
  event.target?.playVideo()
  useTimeoutFn(() => {
    trailerVisible.value = true
  }, 500)
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
  trailerVisible.value = false
  trailerHasError.value = false
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
  <div class="details-container full-height q-pa-sm">
    <div
      class="background text-white"
      :style="{
        backgroundImage: detailsBackground,
      }"
    >
      <div class="flex no-wrap full-height relative">
        <div v-if="$q.screen.gt.md" class="poster q-py-md q-pl-md">
          <router-link
            v-if="props.type === 'episode'"
            :to="{
              path: `show/${info.show.ids.slug}/season/${props.info.season}`,
            }"
          >
            <q-img class="poster-image" :src="poster" alt="" />
          </router-link>
          <q-img v-else class="poster-image" :src="props.poster" alt="" />
        </div>
        <q-scroll-area
          class="scroll-area full-width full-height q-pa-md"
          :thumb-style="{ opacity: '0.5' }"
        >
          <div class="flex" :class="{ 'no-wrap': $q.screen.gt.xs }">
            <div
              v-if="$q.screen.gt.md === false"
              class="float-left q-pr-md q-pb-md"
            >
              <router-link
                v-if="props.type === 'episode'"
                :to="{
                  path: `/tv/show/${info.show.ids.slug}/season/${props.info.season}`,
                }"
              >
                <q-img
                  class="poster-small"
                  width="20vw"
                  :ratio="1 / 1.5"
                  :src="props.poster"
                  alt=""
                />
              </router-link>
              <q-img
                v-else
                class="poster-small"
                width="16vw"
                :ratio="1 / 1.5"
                :src="props.poster"
                alt=""
              />
            </div>

            <!-- TITLES -->
            <div class="w-full break-words">
              <h1 class="flex">
                <span class="mr-4">{{ title }}</span>
                <span v-if="year" class="text-lg font-thin">{{ year }}</span>
                <div class="text-lg">
                  <span v-if="info.certification" class="text-primary">
                    {{ info.certification }}
                  </span>
                </div>
              </h1>

              <!-- TAGLINE -->
              <p v-if="info.tmdb_data?.tagline" class="tagline">
                "{{ info.tmdb_data.tagline }}"
              </p>

              <div v-if="info.tmdb_data?.genres" class="q-mb-md">
                <span
                  v-for="genre in info.tmdb_data.genres"
                  :key="genre.id"
                  class="tags"
                >
                  <Badge :value="genre.name" />
                </span>
              </div>

              <!-- RATINGS -->
              <div class="flex">
                <div v-if="isReleased" class="ratings">
                  <div v-if="info.imdb_rating">
                    <img :src="imdb" alt="IMDb">
                    <div>{{ info.imdb_rating }}</div>
                  </div>
                  <div v-if="info.trakt_rating && info.trakt_rating !== '0.0'">
                    <img :src="trakt" alt="Trakt">
                    <div>{{ info.trakt_rating }}</div>
                  </div>
                  <div v-if="info.tmdb_rating && info.tmdb_rating !== '0.0'">
                    <img :src="tmdb" alt="The Movie DB">
                    <div>{{ info.tmdb_rating }}</div>
                  </div>
                </div>
                <div class="flex q-mb-lg">
                  <div v-if="isReleased && user" class="q-mr-sm">
                    <Rating
                      :item="info"
                      :type="props.type"
                      :rating="info.my_rating"
                    />
                  </div>
                  <div v-if="trailerUrl">
                    <q-btn
                      icon="o_slideshow"
                      label="Trailer"
                      color="secondary"
                      outline
                      @click="showTrailer = true"
                    />
                  </div>
                </div>
              </div>

              <!-- LINKS -->
              <div class="info q-mb-lg">
                <span class="mr-2">Links: </span>
                <template v-for="(value, key) in linkIds" :key="key">
                  <template v-if="links[key]">
                    <a
                      :href="links[key].value"
                      target="blank"
                      style="text-decoration: none"
                      class="mr-3"
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
              v-if="$q.screen.gt.sm === false && info.actors?.length > 0"
              :actors="info.actors"
              horizontal
            />

            <Reviews
              class="q-mt-lg"
              :reviews="info.reviews.comments"
              :review-count="info.reviews.total"
              :m-type="type"
            />
          </div>
        </q-scroll-area>
      </div>
    </div>

    <Actors
      v-if="$q.screen.gt.sm && info.actors?.length > 0"
      :actors="info.actors"
    />
  </div>

  <!-- TRAILER -->
  <q-dialog
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
  </q-dialog>
</template>

<style lang="scss" scoped>
@use "sass:map";
@import "~/quasar-variables.scss";

h1 {
  font-size: 32px;
}
button {
  font-weight: 600;
}
.background {
  background-size: cover;
  background-position: center;
  background-color: transparent;
  height: 100%;
  border-radius: 5px;
  overflow: hidden;
  & > div {
    overflow-x: hidden;
  }
  & .clear-logo {
    width: 100%;
    width: 250px;
    height: 97px;
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
  }
}
.details-container {
  & > div:first-child {
    flex: 1;
  }
}
.poster {
  width: 40%;
  min-width: 200px;
  max-width: 600px;
  position: static;
  & .poster-image {
    border-radius: 5px;
    overflow: hidden;
  }
}
.poster-small {
  border-radius: 5px;
  min-width: 120px;
  overflow: hidden;
}
.ratings {
  display: flex;
  flex-wrap: wrap;
  & div {
    display: flex;
    align-items: center;
    margin-bottom: map.get($space-lg, x);
  }
  & div img {
    width: 35px;
  }
  & div div:nth-child(2) {
    font-size: 24px;
    margin: 0 10px 0 10px;
  }
}
.certification {
  border: 1px solid $secondary;
  color: $secondary;
  border-radius: 5px;
  padding: 6px;
  font-size: 0.75em;
}
.tagline {
  font-style: italic;
  font-weight: 300;
}
:deep(.q-dialog) > * {
  padding: 0 !important;
}
.trailer {
  background-color: black;
  width: 100vw;
  max-width: 100vw;
  height: 70vw;
  max-height: 70vh;
  position: relative;
  & > div {
    height: 70vw;
    max-height: 70vh;
    transition: opacity 5s;
  }
  & .trailer-error-text {
    position: absolute;
    top: 50%;
    width: 100%;
    text-align: center;
    padding: 25px;
    background: rgba(0, 0, 0, 0.8);
    font-size: 2em;
  }
}
.tags {
  margin-right: 5px;
  &:last-child {
    margin-right: 0;
  }
}
.technical-details {
  & a {
    color: $accent;
  }
}
</style>
