<script setup lang="ts">
import type { Ref } from 'vue'
import { YoutubeIframe } from '@vue-youtube/component'
import axios from 'axios'
import dayjs from 'dayjs'
import { useQuasar } from 'quasar'
// store
import { useStore } from '~/store/index'
// components
import Actors from '~/components/Actors.vue'
import Rating from '~/components/Rating.vue'
import Reviews from '~/components/Reviews.vue'
// assets
import trailerErrorBack from '~/assets/trailer-error.jpg'
import imdb from '~/assets/imdb_tall.png'
import trakt from '~/assets/trakt-icon-red.svg'
import tmdb from '~/assets/tmdb_tall.svg'
// types
import type Trakt from '~/api/trakt.types'
import type { TechnicalDetails } from '~/types/types'
import type { EpisodeDetails, SeasonDetails, ShowDetails } from '~/api/combinedCall.types'

const props = defineProps<{
  info: ShowDetails | EpisodeDetails | SeasonDetails
  title: string
  subTitle?: string | number
  poster: string
  technicalDetails: TechnicalDetails[]
  linkIds: Trakt.Ids
  type?: string
}>()

// data
const $q = useQuasar()
const store = useStore()
const user: Ref<Trakt.User> = ref(JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user)
const watchedProgress: Ref<number> = ref(0)
const trailerUrl: Ref<string> = ref('')
const showTrailer: Ref<boolean> = ref(false)
const trailerVisible: Ref<boolean> = ref(false)
const trailerHasError: Ref<boolean> = ref(false)
const seeMoreDetails: Ref<boolean> = ref(false)

// computed
const links = computed(() => {
  const linkSeason = props.info.type === 'season'
  const trakt = props.info.type === 'episode' ? 'trakt' : 'slug'
  return {
    imdb: {
      label: 'IMDb',
      value: `https://www.imdb.com/title/${props.linkIds.imdb}${
            linkSeason ? `/episodes?season=${props.info.season}` : ''
          }`,
    },
    tmdb: {
      label: 'TMDb',
      value: `https://themoviedb.org/${props.info.type === 'movie' ? props.info.type : 'tv'}/${
            props.linkIds.tmdb
          }${props.info.season ? `/season/${props.info.season}` : ''}${
            props.info.type === 'episode' ? `/episode/${props.info.number}` : ''
          }`,
    },
    [trakt]: {
      label: 'Trakt',
      value: `https://trakt.tv/${props.info.type === 'movie' ? props.info.type : 'show'}s/${
            props.linkIds.slug
          }${props.info.season ? `/seasons/${props.info.season}` : ''}${
            props.info.type === 'episode' ? `/episodes/${props.info.number}` : ''
          }`,
    },
  }
})
const watchedPercent = computed(() => `${props.info.watched_progress?.completed} of ${props.info.watched_progress?.aired} episodes watched`)
const detailsBackground = computed(() => {
  return `linear-gradient(to top right, rgba(0,0,0,.8), rgba(0,0,0,.5) 70%, rgba(0,0,0,.3)),
              linear-gradient(to top      , rgba(0,0,0,.5), rgba(0,0,0,.2) 70%, rgba(0,0,0,0)),
              linear-gradient(to right    , rgba(0,0,0,.5), rgba(0,0,0,.2) 70%, rgba(0,0,0,0)),
              url(${props.info?.backdrop.backdrop_lg})`
})
const technicalDetailsFiltered = computed(() => props.technicalDetails.filter(item => item.value))
const isTrailerVisible = computed(() => trailerVisible.value)

// methods
function formattedDateTime(wDate: string) {
  return `${dayjs(wDate).format('MMM DD, YYYY')} at ${dayjs(wDate).format('h:mma')}`
}
function truncateDetails(details) {
  return seeMoreDetails.value ? details : details.split(',', 2).toString()
}
function trailerReady(event: Event) {
  event.target?.playVideo()
  useTimeoutFn(() => {
    trailerVisible.value = true
  }, 500)
}
async function trailerError() {
  if (trailerUrl.value === props.info.trailer.split('v=')[1]) {
    const newTrailer = await axios.get(
          `https://youtube.googleapis.com/youtube/v3/search?q=${props.info.title}+trailer&type=video&key=${process.env.YOUTUBE_API_KEY}`,
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
  store.updateFilter({ label: null, value: null })

  trailerUrl.value = props.info.trailer?.split('v=')[1]
  // for animation purposes
  if (props.info?.watched_progress) {
    useTimeoutFn(() => {
      const wp = props.info.watched_progress
      watchedProgress.value = wp.completed / wp.aired
    }, 500)
  }
})
</script>

<template>
  <div class="full-height q-pl-sm">
    <div class="details-container q-pt-sm q-pr-sm">
      <q-scroll-area
        class="background text-white"
        :style="{
          backgroundImage: detailsBackground,
        }"
        :thumb-style="{ opacity: '0.5' }"
      >
        <div class="flex no-wrap q-pa-md">
          <div v-if="$q.screen.gt.md" class="poster q-pr-md">
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
          <div class="full-width">
            <div class="flex" :class="[{ 'no-wrap': $q.screen.gt.xs }]">
              <div v-if="$q.screen.gt.md === false" class="float-left q-pr-md q-pb-md">
                <router-link
                  v-if="props.type === 'episode'"
                  :to="{
                    path: `show/${info.show.ids.slug}/season/${props.info.season}`,
                  }"
                >
                  <q-img class="poster-small" width="20vw" :ratio="1 / 1.5" :src="props.poster" alt="" />
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
              <div class="break full-width">
                <div class="q-mb-md">
                  <router-link
                    v-if="props.type === 'episode' || props.type === 'season'"
                    :to="{
                      path: `/tv/show/${info.show.ids.slug}`,
                    }"
                  >
                    <q-img
                      v-if="info.clear_logo && $q.screen.gt.xs"
                      role="heading"
                      aria-level="1"
                      class="clear-logo"
                      :src="info.clear_logo"
                      :alt="title"
                    />
                    <h1 v-else>
                      {{ title }}
                    </h1>
                  </router-link>
                  <template v-else>
                    <q-img
                      v-if="info.clear_logo && $q.screen.gt.xs"
                      role="heading"
                      aria-level="1"
                      class="clear-logo"
                      :src="info.clear_logo"
                      :alt="title"
                    />
                    <h1 v-else>
                      {{ title }}
                    </h1>
                  </template>
                </div>
                <div v-if="subTitle" class="sub-title q-mt-sm">
                  <div class="q-mb-md q-mr-sm">
                    {{ subTitle }}
                  </div>
                  <div v-if="info.certification" class="certification q-mr-sm q-mb-md">
                    {{ info.certification }}
                  </div>
                  <div v-if="info.tmdb_data?.tagline" class="tagline q-mb-md">
                    - "{{ info.tmdb_data.tagline }}"
                  </div>
                </div>
                <div v-if="info.tmdb_data?.genres" class="q-mb-md">
                  <span v-for="genre in info.tmdb_data.genres" :key="genre.id" class="tags">
                    <q-badge color="secondary" class="text-dark">
                      {{ genre.name }}
                    </q-badge>
                  </span>
                </div>
                <div class="flex q-mb-md">
                  <!-- LINKS -->
                  <div class="info q-mr-md">
                    <span>Links: </span>
                    <template v-for="(value, key) in linkIds" :key="key">
                      <template v-if="links[key]">
                        <a :href="links[key].value" target="blank" style="text-decoration: none">
                          <q-badge color="secondary" text-color="black" class="q-mx-xs" outline>{{
                            links[key].label
                          }}</q-badge>
                        </a>
                      </template>
                    </template>
                  </div>
                  <!-- WATCHED INFO -->
                  <div v-if="info.watched_progress?.last_watched_at" class="flex info">
                    <div>
                      <span>last watched:&nbsp;</span>
                      {{ formattedDateTime(info.watched_progress.last_watched_at) }}
                    </div>
                    <div v-if="info.watched_progress?.type === 'movie'">
                      <span>plays:&nbsp;</span>
                      {{ info.watched_progress.plays }}
                    </div>
                  </div>
                </div>
                <div class="flex no-wrap q-mb-lg">
                  <div class="flex info">
                    <!-- TECHNICAL DETAILS -->
                    <div
                      v-for="item in technicalDetailsFiltered"
                      :key="item.value"
                      class="technical-details"
                    >
                      <template v-if="item.label !== 'production companies' && item.value">
                        <span>{{ item.label }}: </span>{{ item.value }}
                      </template>
                      <template v-else-if="item.value">
                        <span>{{ item.label }}: </span>{{ truncateDetails(item.value) }}
                        <a
                          v-if="item.value.split(',').length > 2"
                          href="javascript:"
                          @click="seeMoreDetails = !seeMoreDetails"
                        >{{ seeMoreDetails ? 'See less' : 'See more' }}</a>
                      </template>
                    </div>
                  </div>
                  <q-space />
                  <div v-if="info.watched_progress?.type === 'show'">
                    <q-knob
                      v-model="watchedProgress"
                      readonly
                      :max="1"
                      show-value
                      size="50px"
                      :thickness="0.2"
                      color="secondary"
                      track-color="grey-8"
                      class="text-white"
                    >
                      <q-icon name="o_check_circle_outline" size="sm" color="positive" />
                    </q-knob>
                    <q-tooltip :delay="500">
                      {{ watchedPercent }}
                    </q-tooltip>
                  </div>
                  <div v-else-if="info.watched_progress?.last_watched_at">
                    <q-icon name="o_check_circle_outline" size="lg" color="positive" />
                  </div>
                </div>
                <div class="flex">
                  <!-- RATINGS -->
                  <div class="ratings">
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
                    <div v-if="user" class="q-mr-sm">
                      <Rating :item="info" :type="props.type" :rating="info.my_rating" />
                    </div>
                    <div v-if="info.trailer">
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
              </div>
            </div>
            <!-- OVERVIEW -->
            <p v-if="info.tmdb_data.overview" class="q-mb-none">
              {{ info.tmdb_data.overview }}
            </p>
            <div>
              <!-- MOVIE COLLECTION -->
              <slot name="movie-collection" />
              <!-- SHOW SEASONS -->
              <slot name="show-seasons" />
              <!-- SEASONS EPISODES -->
              <slot name="season-episode-list" />
              <Actors
                v-if="$q.screen.gt.sm === false && info.actors?.length > 0"
                :actors="info.actors"
                horizontal
              />
              <Reviews class="q-mt-lg" :reviews="info.reviews" :review-count="info.comment_count" />
            </div>
          </div>
        </div>
      </q-scroll-area>
      <Actors v-if="$q.screen.gt.sm && info.actors?.length > 0" :actors="info.actors" />
    </div>
  </div>
  <q-dialog v-model="showTrailer" :transition-duration="500" class="trailer" @hide="closeTrailer">
    <div class="trailer">
      <div v-if="trailerHasError" :style="{ backgroundImage: `url(${trailerErrorBack})` }">
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
@import '~/quasar-variables.scss';

h1 {
  font-size: 18px;
  margin-top: 20px;
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
    // filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5));
  }
}
.break {
  word-break: break-word;
}
.sub-title {
  font-size: 1.5em;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  & i {
    font-size: 0.6em;
  }
}
.details-container {
  padding-top: 0;
  padding-left: 0;
  display: flex;
  height: 100%;
  & > div:first-child {
    flex: 1;
  }
}
.poster {
  width: 40%;
  min-width: 200px;
  max-width: 600px;
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
  & > div {
    display: flex;
    align-items: center;
    margin-bottom: map.get($space-lg, x);
  }
  & div > img {
    width: 35px;
  }
  & > div > div:nth-child(2) {
    font-size: 24px;
    margin: 0 10px 0 10px;
  }
}
.info {
  flex-wrap: wrap;
  & > div:not(:last-child) {
    margin-right: map.get($space-md, x)
  }
  & span {
    @include darkText;
  }
  & a {
    color: white;
  }
}
.certification {
  border: 1px solid $secondary;
  color: $secondary;
  border-radius: 3px;
  padding: 2px 5px;
  font-size: 0.75em;
}
.tagline {
  font-style: italic;
  font-size: 0.65em;
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
