<script setup lang="ts">
import type { Ref } from 'vue'
import dayjs from 'dayjs'
// store
import { useStore } from '~/stores/mainStore'
// types
import type Trakt from '~/api/trakt.types'
import type { CardInfo } from '~/api/combinedCall.types'
// images
import tmdb from '~/assets/tmdb_tall.svg'
import { MediaType } from '~/types/types'

// types
interface LoopKeys {
  show: MediaType.show
  movie: MediaType.movie
  episode: MediaType.episode
}
interface RatingData {
  user_count?: number
  watchers?: string
  imdb_rating?: string
  trakt_rating?: string
  tmdb_rating?: string
  my_rating?: {
    rating: number
  }
}

// props
const props = defineProps<{ data: CardInfo[], mType: keyof LoopKeys }>()

// data
const router = useRouter()
const store = useStore()
const user: Ref<Trakt.User> = ref(
  JSON.parse(localStorage.getItem('trakt-vue-user')!)?.user,
)
const sortedData: Ref<CardInfo[]> = ref([])
const ratingsBox: Ref<any> = ref([])

// computed
const isEpisode = computed(() => {
  return store.filterType === 'show' && store.filter?.val === 'history'
})

// methods
function ratings(data: RatingData) {
  interface IconData {
    icon?: string
    img?: string
    value: string | number
    tooltip?: string
    color?: string
  }
  const createRating = (
    icon: string,
    value: string | number,
    tooltip?: string,
    color?: string,
  ): IconData => {
    return { icon, value, tooltip, color }
  }
  const ratingsArr: IconData[] = []

  if (store.filter.val === 'trakt_recommended')
    ratingsArr.push(createRating('carbon:recommend', data.user_count!))

  if (data.watchers) {
    ratingsArr.push(
      createRating(
        'noto:eyes',
        data.watchers,
        `${data.watchers} people watching now`,
      ),
    )
  }
  if (data.imdb_rating) {
    ratingsArr.push(
      createRating('fa-brands:imdb', data.imdb_rating, undefined, 'text-imdb'),
    )
  }
  if (data.trakt_rating && data.trakt_rating !== '0.0') {
    ratingsArr.push(
      createRating(
        'simple-icons:trakt',
        data.trakt_rating,
        undefined,
        'text-trakt',
      ),
    )
  }
  if (data.tmdb_rating && data.tmdb_rating !== '0.0')
    ratingsArr.push({ img: tmdb, value: data.tmdb_rating })

  if (data.my_rating) {
    const value
      = data.my_rating.rating === 10
        ? data.my_rating.rating.toString()
        : data.my_rating.rating.toFixed(1)
    ratingsArr.push({ img: user.value.images.avatar.full, value })
  }
  return ratingsArr
}

function formattedDateTime(wDate: string) {
  return `${dayjs(wDate).format('MMM DD, YYYY')} at ${dayjs(wDate).format(
    'h:mma',
  )}`
}

function hasRatings(index: number) {
  return ratingsBox.value[index]?.children.length !== 0
}

function clickDetails(item: CardInfo) {
  const ids: Trakt.Ids = item[props.mType]!.ids

  store.updateCurrentIds(ids)

  if (item.type === MediaType.episode) {
    router.push({
      path: `${store.filterType === 'movie' ? 'movie' : 'show'}/${
        ids.slug
      }/season/${item.episode?.season}/episode/${item.episode?.number}`,
    })
  }
  else {
    if (store.filterType === 'movie') {
      router.push({ name: 'movie-details', params: { movie: ids.slug } })
    }
    else {
      router.push({
        path: `show/${ids.slug}`,
      })
    }
  }
}

// lifecycle methods
onMounted(() => {
  switch (store.filter.val) {
    case 'anticipated':
      sortedData.value = [...props.data].sort((a, b) =>
        a.list_count! < b.list_count! ? 1 : -1,
      )
      break
    case 'trakt_recommended':
      sortedData.value = [...props.data].sort((a, b) =>
        a.user_count! < b.user_count! ? 1 : -1,
      )
      break
    default:
      sortedData.value = props.data
  }
})
</script>

<template>
  <ScrollArea>
    <div
      class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-5"
    >
      <div
        v-for="(item, index) in sortedData"
        :key="item[store.filterType]?.ids.slug"
        class="cursor-pointer relative pb-[56.25%]"
        @click="clickDetails(item)"
        @keyDown="clickDetails(item)"
      >
        <div
          class="absolute w-full h-full flex justify-center items-center bg-slate-400 animate-bg-pulse"
        >
          <iconify-icon
            icon="mdi:image"
            width="4em"
            height="4em"
            class="text-white"
          />
        </div>
        <Image v-if="item.backdrop" :src="item.backdrop.backdrop_sm" aria-hidden class="absolute" />
        <div v-if="item.clear_logo" class="absolute top-0 m-3 z-10">
          <Image :src="item.clear_logo" aria-hidden class="w-1/3" />
        </div>
        <div
          v-if="store.filter.val === 'anticipated'"
          class="absolute right-0 flex m-2 text-center rounded-md"
        >
          <div class="p-3 rounded-md bg-black/50 text-3xl">
            {{ index + 1 }}
          </div>
        </div>
        <div
          v-else
          ref="ratingsBox"
          class="absolute top-0 right-0 m-2 flex text-center bg-black/50 rounded-md p-3"
          :class="{ invisible: !hasRatings(index) }"
        >
          <div
            v-for="i in ratings(item)"
            :key="JSON.stringify(i)"
            class="h-full"
          >
            <div class="h-7 m-1">
              <img
                v-if="i.img"
                :src="i.img"
                aria-hidden="true"
                class="block h-full py-1"
              >
              <iconify-icon
                v-else
                :icon="i.icon"
                width="100%"
                height="100%"
                class="block h-full"
                :class="[i.color]"
              />
            </div>
            <div class="font-extralight">
              {{ i.value }}
            </div>
            <Tooltip v-if="i.tooltip" :value="i.tooltip" />
          </div>
        </div>
        <div
          class="absolute bottom-0 left-0 right-0 p-3 bg-black/50 flex flex-nowrap justify-between items-center leading-10"
        >
          <div class="max-w-[50%]">
            <div class="text-lg font-bold" role="heading">
              {{ item[mType]?.title }}
            </div>
            <div class="text-sm">
              {{ item[mType]?.year }}
            </div>
          </div>

          <div v-if="isEpisode" class="pl-2 text-right max-w-[50%]">
            <div class="whitespace-nowrap text-ellipsis overflow-hidden ">
              <b>
                {{ item.episode?.season }}x{{
                  item.episode?.number.toString().padStart(2, "0")
                }}
              </b>
              <span class="text-sm pl-1">{{ item.episode?.title }}</span>
            </div>
            <div class="text-xs flex align-middle justify-end">
              <iconify-icon
                icon="carbon:recently-viewed"
                height="1.3em"
                class="mr-1"
              />
              <span>{{ formattedDateTime(item.watched_at!) }}</span>
            </div>
          </div>
          <div v-else class="max-w-[50%] flex flex-wrap justify-end">
            <Badge
              v-for="genre in item.genres"
              :key="genre.id" :value="genre.name" class="text-xs py-px px-1 ml-1 first:ml-0 my-0.5 text-nowrap"
            />
          </div>
        </div>
      </div>
    </div>
  </ScrollArea>
</template>
