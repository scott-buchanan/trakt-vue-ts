<script setup lang="ts">
import type { Ref } from 'vue'
import type Trakt from '~/api/trakt.types'
import type { Filter } from '~/store/models'
import { useStore } from '~/store/index'
import { getAppBackgroundImg } from '~/api/tmdb'
import { getIdLookupTmdb } from '~/api/trakt'
import defaultImage from '~/assets/drawer-image-1.jpg'
import vuejs from '~/assets/vuejs.png'
import trakt from '~/assets/trakt-wide-red-white.svg'
import tmdb from '~/assets/tmdb.svg'
import fanart from '~/assets/fanart.tv.png'

const router = useRouter()
const route = useRoute()
const store = useStore()
const defaultBack = defaultImage
const drawer = ref(true)
interface backgroundInfoType { backgroundUrl: string; posterUrl: string; ids: Trakt.Ids | null; id: number; title: string; type: string; year: string }
const backgroundInfo: Ref<backgroundInfoType> = ref({} as backgroundInfoType)
const transparentBack = ref(false)

// computed
const backgroundImgTo = computed(() => {
  const to = `/${backgroundInfo.value.type === 'movie' ? 'movie' : 'tv/show'}/${backgroundInfo.value.ids?.slug}`
  return route.path === to ? null : to
})
const filterOptions = computed(() => {
  const options = { ...store.filterOptions }
  if (!store.myInfo) {
    let key: keyof typeof options
    for (key in options)
      options[key] = options[key].filter(item => item.auth === false)
  }
  return options
})

// methods
function handleMenuClick(item: Filter, filterType: string) {
  store.updateLoading(false)
  store.updateFilterType(filterType)
  store.updatePage(1)
  store.updateFilter(item)
  router.push({
    path: filterType === 'movie' ? `/movie/${item.val}` : `/tv/${item.val}`,
  })
}
function goHome() {
  router.push('/')
}

// lifecycle hooks
onMounted(async () => {
  const appBack = await getAppBackgroundImg()
  const idLookup = await getIdLookupTmdb(appBack.id, appBack.type)
  backgroundInfo.value = { ...appBack, ...idLookup! }
})
</script>

<template>
  <q-layout
    view="lHh LpR lFf"
    l-hh lp-r l-ff
    class="layout full-height"
    :style="{ backgroundImage: `url(${backgroundInfo?.backgroundUrl})` }"
  >
    <Header :page="store.$state.page" />
    <q-drawer
      v-if="$q.screen.xs === false"
      v-model="drawer"
      show-if-above
      :breakpoint="1"
      :overlay="false"
      class="app-drawer q-pa-sm"
      :width="250"
      persistent
      dark
    >
      <div>
        <q-img
          :src="
            store.myInfo?.account.cover_image
              ? `${store.myInfo?.account.cover_image}.webp`
              : defaultBack
          "
          style="height: 150px"
          referrerpolicy="no-referrer"
        >
          <div v-if="store.myInfo" class="absolute-bottom">
            <div>
              <div class="text-weight-bold">
                {{ store.myInfo?.user.name }}
              </div>
              <div>
                <a :href="`https://trakt.tv/users/${store.myInfo?.user.username}`" target="blank">
                  @{{ store.myInfo?.user.username }}
                </a>
              </div>
            </div>
          </div>
        </q-img>

        <q-list dark class="flex column col-grow">
          <q-item-label header>
            TV Shows
          </q-item-label>
          <q-item
            v-for="link, index in filterOptions.show"
            :key="index"
            dense
            clickable
            color="secondary"
            active-class="bg-secondary"
            :active="store.filter?.val === link.val && store.filterType === 'show'"
            @click="handleMenuClick(link, 'show')"
          >
            <q-item-section dark>
              {{ link.label }}
            </q-item-section>
          </q-item>

          <q-item-label header>
            Movies
          </q-item-label>
          <q-item
            v-for="link, index in filterOptions.movie"
            :key="index"
            dense
            clickable
            color="secondary"
            active-class="bg-secondary"
            :active="store.filter?.val === link.val && store.filterType === 'movie'"
            @click="handleMenuClick(link, 'movie')"
          >
            <q-item-section dark>
              {{ link.label }}
            </q-item-section>
          </q-item>

          <q-space />

          <q-item
            dense
            manual-focus
            :clickable="backgroundImgTo !== null"
            :to="backgroundImgTo"
            class="background-poster pb-3 full-width"
            @mouseover="transparentBack = true"
            @mouseleave="transparentBack = false"
          >
            <q-item-section dark :class="{ 'background-link': backgroundInfo.posterUrl }">
              <q-img
                v-if="backgroundInfo.posterUrl"
                :src="backgroundInfo.posterUrl"
                :alt="backgroundInfo.title"
                referrerpolicy="no-referrer"
                :ratio="9 / 16"
              />
              <span v-else>{{ backgroundInfo.title }}</span>
            </q-item-section>
            <q-tooltip>{{ backgroundInfo.title }} ({{ backgroundInfo.year }})</q-tooltip>
          </q-item>
        </q-list>

        <div class="hidden bottom-links text-white">
          <div>Powered by</div>
          <div>
            <a href="https://vuejs.org/" target="blank">
              <img :src="vuejs" alt="Vue.js">
            </a>
            <a href="https://trakt.tv/" target="blank">
              <img :src="trakt" alt="The Movie DB">
            </a>
            <a href="https://www.themoviedb.org/" target="blank">
              <img :src="tmdb" alt="The Movie DB">
            </a>
            <a href="https://fanart.tv/" target="blank">
              <img :src="fanart" alt="fanart.tv">
            </a>
          </div>
        </div>
      </div>
    </q-drawer>
    <q-page-container class="page-container full-height" :class="[{ 'background-animate': backgroundImgTo }, { 'blur opacity-30': transparentBack && backgroundImgTo }]" h90>
      <div v-if="!store.loaded" class="loader q-pa-sm">
        <div class="full-height full-width">
          <LoaderFingers />
        </div>
      </div>

      <!-- page renders here -->
      <div class="full-height q-pt-sm">
        <router-view />
      </div>
    </q-page-container>
  </q-layout>
</template>

<style lang="scss" scoped>
.background-link {
  width: 100%;
}
</style>

<style lang="scss">
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400&&display=swap');
  @import '~/quasar-variables.scss';

  * {
    box-sizing: border-box;
  }

  html,
  body {
    height: 100%;
    min-height: 100%;
    overflow: hidden;
    color: white;
  }
  a,
  a:visited,
  a:active,
  a:hover {
    text-decoration: none !important;
    // color: $accent !important;
  }
  a:hover {
    text-decoration: underline;
  }
  h1 {
    font-size: 24px;
    line-height: 1;
  }
  h2 {
    font-size: 24px;
    line-height: 1;
  }
  a,
  a:hover,
  a:active {
    color: white;
  }
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: white;
    padding: 0;
  }
  .q-dialog__backdrop {
    background: rgba(0, 0, 0, 0.9) !important;
  }
  .layout {
    background-size: cover;
    background-repeat: no-repeat;
    background-attachment: fixed;
  }
  .scroll-area {
    height: calc(100% - 150px);
  }
  .app-drawer {
    padding-right: 0;
    & > div {
      display: flex;
      flex-direction: column;
      & .bottom-links {
        width: 100%;
        font-size: 0.8em;
        text-align: right;
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
        & > div:first-child {
          flex-grow: 1;
          margin-right: 15px;
          padding-bottom: 7px;
        }
        & > div > a {
          &:first-child > img {
            margin-left: -22px;
            width: 112px;
          }
          & > img {
            width: 90px;
            margin: 0 7px 7px 0;
            display: block;
          }
        }
      }
    }
  }
  .q-drawer {
    background: none !important;
    & > div > div {
      background-color: rgba(0, 0, 0, $opacity-back) !important;
      height: 100%;
      border-radius: 5px;
      overflow: hidden;
    }
    .btn-avatar {
      position: absolute;
      top: 0;
      left: 0;
      width: 200px;
    }
  }
  .page-container {
    &.background-animate {
      transition-property: opacity, filter;
      transition-duration: 0.5s;
      transition-timing-function: ease-in-out;
      &.blur{
        filter: blur(10px);
      }
  }
  }
  .loader {
    height: 100%;
    & > div {
      @include background-style;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  body::-webkit-scrollbar-track-piece {
    display: none;
  }

  /* width */
  ::-webkit-scrollbar {
    display: none;
    width: 10px;
    background: url('~/assets/transparent.png') repeat;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    display: block;
    background: url('~/assets/transparent.png') repeat;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    display: block;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 2px;
  }
  :deep(.q-notify) {
    height: 0;
    min-height: 0;
  }
  </style>
