<script setup lang="ts">
import type { Ref } from 'vue'
import dayjs from 'dayjs'

// store
import { useStore } from '~/store/index'

// types
import type Trakt from '~/api/trakt.types'
import type { CardInfo } from '~/api/combinedCall.types'

// images
import imdb from '~/assets/imdb_tall.png'
import trakt from '~/assets/trakt-icon-red.svg'
import tmdb from '~/assets/tmdb_tall.svg'
import { MediaType } from '~/types/types'

interface LoopKeys {
  show: MediaType.show
  movie: MediaType.movie
  episode: MediaType.episode
}

// props
const props = defineProps<{ data: CardInfo[]; mType: keyof LoopKeys }>()

// data
const router = useRouter()
const store = useStore()
const user: Ref<Trakt.User> = ref(JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user)
const sortedData: Ref<CardInfo[]> = ref([])

// computed
const isEpisode = computed(() => {
  return store.filterType === 'show' && store.filter?.val === 'history'
})

// methods
function formattedDate(wDate: string) {
  return dayjs(wDate).format('MMM DD, YYYY')
}
function formattedDateTime(wDate: string) {
  return `${dayjs(wDate).format('MMM DD, YYYY')} at ${dayjs(wDate).format('h:mma')}`
}
function clickDetails(item: CardInfo) {
  const mType: keyof CardInfo = item.type === MediaType.movie ? MediaType.movie : MediaType.show
  const ids: Trakt.Ids = item[mType]!.ids

  store.updateCurrentIds(ids)

  if (item.type === MediaType.episode) {
    router.push({
      path: `${store.filterType === 'movie' ? 'movie' : 'show'}/${ids.slug}/season/${item.episode?.season}/episode/${item.episode?.number}`,
    })
  }
  else {
    router.push({
      path: `${store.filterType === 'movie' ? 'movie' : 'show'}/${ids.slug}`,
    })
  }
}

onMounted(() => {
  switch (store.filter.val) {
    case 'anticipated':
      sortedData.value = [...props.data].sort((a, b) => a.list_count! < b.list_count! ? 1 : -1)
      break
    case 'trakt_recommended':
      sortedData.value = [...props.data].sort((a, b) => a.user_count! < b.user_count! ? 1 : -1)
      break
    default:
      sortedData.value = props.data
  }
})
</script>

<template>
  <q-scroll-area class="full-height full-width" :thumb-style="{ opacity: '0.5' }">
    <div v-if="data?.length > 0" class="row">
      <div
        v-for="item, index in sortedData"
        :key="item[mType]?.ids.slug"
        class="show-card col-12 col-md-6 col-xl-4"
        @click="clickDetails(item)"
        @keyDown="clickDetails(item)"
      >
        <q-img
          no-spinner
          :src="item.backdrop.backdrop_sm"
          :alt="item[mType]?.title"
          fit="cover"
          :ratio="16 / 9"
        >
          <div v-if="store.filter.val === 'anticipated'" class="card-top-info anticipated absolute-top-right q-ma-sm">
            <q-icon name="o_circle" size="xl" />
            <q-tooltip>
              <span>Appears on {{ item.list_count?.toLocaleString("en-US") }} lists</span>
            </q-tooltip>
            <div class="anticipated-num">
              {{ index + 1 }}
            </div>
          </div>
          <div v-else class="card-top-info absolute-top-right q-ma-sm">
            <div v-if="store.filter.val === 'trakt_recommended'">
              <q-icon name="o_verified" size="24px" class="block q-mt-n q-mb-xs q-ma-none" />
              {{ item.user_count }}
              <q-tooltip :delay="500" :offset="[0, 5]">
                {{ item.user_count }} people recommend this
              </q-tooltip>
            </div>
            <div v-if="item.watchers" class="flex column items-center">
              <q-icon name="o_visibility" size="24px" class="block q-mt-n q-mb-xs q-ma-none" />
              {{ item.watchers }}
              <q-tooltip :delay="500" :offset="[0, 5]">
                {{ item.watchers }} people watching now
              </q-tooltip>
            </div>
            <div v-if="item.imdb_rating">
              <img :src="imdb" :alt="`IMDb rating ${item.imdb_rating}`">
              {{ item.imdb_rating }}
            </div>
            <div v-if="item.trakt_rating && item.trakt_rating !== '0.0'">
              <img :src="trakt" alt="Trakt">
              {{ item.trakt_rating }}
            </div>
            <div v-if="item.tmdb_rating && item.tmdb_rating !== '0.0'">
              <img :src="tmdb" alt="The Movie DB">
              {{ item.tmdb_rating }}
            </div>
            <div v-if="item.my_rating">
              <q-avatar size="20px" class="q-mb-sm block">
                <q-img
                  :src="user?.images.avatar.full"
                  :alt="user?.name"
                  referrerpolicy="no-referrer"
                />
              </q-avatar>
              {{
                item.my_rating.rating === 10
                  ? item.my_rating.rating
                  : item.my_rating.rating.toFixed(1)
              }}
            </div>
          </div>
          <div
            class="absolute-bottom caption flex justify-between items-center no-wrap"
          >
            <div v-if="item.clear_logo" class="clearlogo">
              <q-img
                no-spinner
                :ratio="2.58 / 1"
                height="100%"
                :src="item.clear_logo"
                fit="cover"
                alt=""
              />
            </div>
            <div v-else class="clearlogo-no-img flex items-center">
              {{ item[mType]?.title }}
            </div>
            <div v-if="isEpisode" class="title q-pl-sm">
              <b>
                {{ item.episode?.season }}x{{ item.episode?.number.toString().padStart(2, '0') }}
              </b>
              {{ item.episode?.title }}
              <div class="watched-time">
                <span>
                  <q-icon name="o_watch_later" />
                </span>
                <span>{{ formattedDate(item.watched_at!) }}</span>
                <q-tooltip :delay="500" :offset="[0, 5]">
                  {{ formattedDateTime(item.watched_at!) }}
                </q-tooltip>
              </div>
            </div>
            <div v-else class="text-right">
              <span>
                <b>{{ item[mType]?.year }}</b>
              </span>
              <div>
                <span
                  v-for="genre in item.genres?.slice(0, $q.screen.gt.md === false ? 2 : 4)"
                  :key="genre.id"
                  class="tags"
                >
                  <q-badge color="secondary" class="text-dark">
                    {{ genre.name }}
                  </q-badge>
                </span>
              </div>
            </div>
          </div>
        </q-img>
      </div>
    </div>
  </q-scroll-area>
</template>

<style lang="scss" scoped>
@import '~/quasar-variables.scss';
@import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@300&display=swap');

.show-card {
  cursor: pointer;
  position: relative;
}
.caption > div::first-letter {
  text-transform: uppercase;
}
.caption > .title {
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.clearlogo {
  width: 100px;
  min-width: 100px;
  height: 39px;
  // filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
}
.clearlogo-no-img {
  height: 39px;
}
.card-top-info {
  display: flex;
  padding: 10px 20px;
  text-align: center;
  line-height: 1em;
  font-family: 'Comfortaa', cursive;
  border-radius: 5px;
  &.anticipated {
    padding: 5px;
    border-radius: 50%;
    color: $secondary;
  }
  & > div:not(:last-child) {
    margin-right: 10px;
  }
  & img {
    height: 20px;
    display: block;
    margin-bottom: 8px;
  }
  & .anticipated-num {
    position: absolute;
    width: 30px;
    line-height: 30px;
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    margin-top: 1px;
    height: 30px;
    top: calc(50% - 15px);
    left: calc(50% - 15px);
  }
}
.tags {
  margin-right: 5px;
  &:last-child {
    margin-right: 0;
  }
}
.watched-time {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: -2px;
  & > span:first-child {
    font-size: 1.2em;
    margin-right: 5px;
  }
  & > span:nth-child(2) {
    font-size: 1em;
    line-height: 1;
    margin-bottom: -1px;
    font-size: 0.8em;
  }
}
</style>
