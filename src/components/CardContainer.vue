<script setup lang="ts">
import type { Ref } from "vue";
import dayjs from "dayjs";
// store
import { useStore } from "~/store/index";
// types
import type Trakt from "~/api/trakt.types";
import type { CardInfo } from "~/api/combinedCall.types";
// images
import tmdb from "~/assets/tmdb_tall.svg";
import { MediaType } from "~/types/types";
// components
import Badge from "./Badge.vue";

// types
interface LoopKeys {
  show: MediaType.show;
  movie: MediaType.movie;
  episode: MediaType.episode;
}
interface RatingData {
  user_count?: number;
  watchers?: string;
  imdb_rating?: string;
  trakt_rating?: string;
  tmdb_rating?: string;
  my_rating?: {
    rating: number;
  };
}

// props
const props = defineProps<{ data: CardInfo[]; mType: keyof LoopKeys }>();

// data
const router = useRouter();
const store = useStore();
const user: Ref<Trakt.User> = ref(
  JSON.parse(localStorage.getItem("trakt-vue-user")!)?.user,
);
const sortedData: Ref<CardInfo[]> = ref([]);
const ratingsBox: Ref<any> = ref([]);

// computed
const isEpisode = computed(() => {
  return store.filterType === "show" && store.filter?.val === "history";
});

// methods
function ratings(data: RatingData) {
  interface IconData {
    icon?: string;
    img?: string;
    value: string | number;
    tooltip?: string;
    color?: string;
  }
  const createRating = (
    icon: string,
    value: string | number,
    tooltip?: string,
    color?: string,
  ): IconData => {
    return { icon, value, tooltip, color };
  };
  const ratingsArr: IconData[] = [];

  if (store.filter.val === "trakt_recommended") {
    ratingsArr.push(createRating("carbon:recommend", data.user_count!));
  }
  if (data.watchers) {
    ratingsArr.push(
      createRating(
        "mdi:visibility",
        data.watchers,
        `${data.watchers} people watching now`,
      ),
    );
  }
  if (data.imdb_rating) {
    ratingsArr.push(
      createRating("fa-brands:imdb", data.imdb_rating, undefined, "text-imdb"),
    );
  }
  if (data.trakt_rating && data.trakt_rating !== "0.0") {
    ratingsArr.push(
      createRating(
        "simple-icons:trakt",
        data.trakt_rating,
        undefined,
        "text-trakt",
      ),
    );
  }
  if (data.tmdb_rating && data.tmdb_rating !== "0.0") {
    ratingsArr.push({ img: tmdb, value: data.tmdb_rating });
  }
  if (data.my_rating) {
    const value =
      data.my_rating.rating === 10
        ? data.my_rating.rating.toString()
        : data.my_rating.rating.toFixed(1);
    ratingsArr.push({ img: user.value.images.avatar.full, value });
  }
  return ratingsArr;
}

function formattedDate(wDate: string) {
  return dayjs(wDate).format("MMM DD, YYYY");
}

function formattedDateTime(wDate: string) {
  return `${dayjs(wDate).format("MMM DD, YYYY")} at ${dayjs(wDate).format("h:mma")}`;
}

function hasRatings(index: number) {
  return ratingsBox.value[index]?.children.length !== 0;
}

function clickDetails(item: CardInfo) {
  const mType: keyof CardInfo =
    item.type === MediaType.movie ? MediaType.movie : MediaType.show;
  const ids: Trakt.Ids = item[mType]!.ids;

  store.updateCurrentIds(ids);

  if (item.type === MediaType.episode) {
    router.push({
      path: `${store.filterType === "movie" ? "movie" : "show"}/${ids.slug}/season/${item.episode?.season}/episode/${item.episode?.number}`,
    });
  } else {
    if (store.filterType === "movie") {
      router.push({ name: "movie-details", params: { movie: ids.slug } });
    } else {
      router.push({
        path: `show/${ids.slug}`,
      });
    }
  }
}

// lifecycle methods
onMounted(() => {
  switch (store.filter.val) {
    case "anticipated":
      sortedData.value = [...props.data].sort((a, b) =>
        a.list_count! < b.list_count! ? 1 : -1,
      );
      break;
    case "trakt_recommended":
      sortedData.value = [...props.data].sort((a, b) =>
        a.user_count! < b.user_count! ? 1 : -1,
      );
      break;
    default:
      sortedData.value = props.data;
  }
});
</script>

<template>
  <q-scroll-area class="h-full w-full" :thumb-style="{ opacity: '0.5' }">
    <div
      v-if="data?.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3"
    >
      <div
        v-for="(item, index) in sortedData"
        :key="item[mType]?.ids.slug"
        class="cursor-pointer relative"
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
          <div v-if="item.clear_logo" class="bg-transparent">
            <img :src="item.clear_logo" aria-hidden="true" class="w-1/3" />
          </div>
          <div
            v-if="store.filter.val === 'anticipated'"
            class="absolute right-0 flex m-2 text-center rounded-md"
          >
            <q-icon name="o_circle" size="xl" />
            <q-tooltip>
              <span
                >Appears on
                {{ item.list_count?.toLocaleString("en-US") }} lists</span
              >
            </q-tooltip>
            <div class="anticipated-num">
              {{ index + 1 }}
            </div>
          </div>
          <div
            v-else
            ref="ratingsBox"
            class="absolute right-0 flex m-2 text-center rounded-md"
            :class="[{ invisible: !hasRatings(index) }]"
          >
            <table>
              <tr>
                <td v-for="i in ratings(item)" class="p-1">
                  <img
                    v-if="i.img"
                    :src="i.img"
                    aria-hidden="true"
                    class="block h-5"
                  />
                  <iconify-icon
                    v-else
                    :icon="i.icon"
                    width="2em"
                    height="2em"
                    :class="[i.color, 'block']"
                  />
                  <q-tooltip v-if="i.tooltip" :delay="500" :offset="[0, 5]">
                    {{ i.tooltip }}
                  </q-tooltip>
                </td>
              </tr>
              <tr>
                <td v-for="i in ratings(item)">
                  {{ i.value }}
                </td>
              </tr>
            </table>
          </div>
          <div
            class="absolute bottom-0 left-0 right-0 flex flex-nowrap justify-between items-center"
          >
            <div class="flex flex-col justify-between">
              <h1 class="text-xl mb-1">
                {{ item[mType]?.title }}
              </h1>
              <div>{{ item[mType]?.year }}</div>
            </div>
            <div v-if="isEpisode" class="pl-2">
              <b>
                {{ item.episode?.season }}x{{
                  item.episode?.number.toString().padStart(2, "0")
                }}
              </b>
              {{ item.episode?.title }}
              <div class="flex items-center justify-end">
                <iconify-icon
                  icon="carbon:recently-viewed"
                  height="1.3em"
                  class="mr-1"
                />
                <span>{{ formattedDate(item.watched_at!) }}</span>
                <q-tooltip :delay="500" :offset="[0, 5]">
                  Watched on {{ formattedDateTime(item.watched_at!) }}
                </q-tooltip>
              </div>
            </div>
            <div v-else class="text-right">
              <span
                v-for="genre in item.genres?.slice(
                  0,
                  $q.screen.gt.md === false ? 2 : 4,
                )"
                :key="genre.id"
                class="mr-1 last:mr-0"
              >
                <Badge :value="genre.name" />
              </span>
            </div>
          </div>
        </q-img>
      </div>
    </div>
  </q-scroll-area>
</template>
