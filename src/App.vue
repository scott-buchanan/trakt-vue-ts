<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { useStore } from "~/store/index";
// api
import { getToken, getTraktSettings, getTokenFromRefresh } from "./api/trakt";
import { getAppBackgroundImg, getImageUrls } from "~/api/tmdb";
// assets
import defaultImage from "~/assets/drawer-image-1.jpg";
import vuejsLogo from "~/assets/vuejs.png";
import traktLogo from "~/assets/trakt-icon-red.svg";
// types
import Trakt from "./api/trakt.types";

import "iconify-icon";

const store = useStore();
const route = useRoute();
const router = useRouter();

const defaultBack = defaultImage;

interface BackgroundInfoType {
  backgroundUrl: string;
  posterUrl: string;
  id: number;
  title: string;
  type: string;
  year: string;
}

const backgroundInfo: Ref<BackgroundInfoType> = ref({} as BackgroundInfoType);

// computed
const filterOptions = computed(() => {
  const options = { ...store.filterOptions };
  if (!store.myInfo) {
    let key: keyof typeof options;
    for (key in options)
      options[key] = options[key].filter((item) => item.auth === false);
  }
  return options;
});

// Watch for code in route query and login
watch(
  () => route.query.code,
  async (code) => {
    // check for code if redirecting from Trakt oauth
    if (code) {
      // take code and get token using authorization code
      const authTokens: Trakt.AuthTokens = await getToken(code as string);

      if (authTokens) {
        const myInfo: Trakt.MyInfo = await getTraktSettings();

        store.updateTokens(authTokens);
        store.updateMyInfo(myInfo);

        // remove code from url
        if (route.name) router.push({ name: route.name });
      }
    }
  },
);

// lifecycle hooks
onMounted(async () => {
  // log in
  const tokenString: string | null = localStorage.getItem("trakt-vue-token");

  if (tokenString !== null) {
    const authTokens: Trakt.AuthTokens = JSON.parse(tokenString);
    const myInfo: Trakt.MyInfo = await getTraktSettings();

    store.updateTokens(authTokens);
    store.updateMyInfo(myInfo);
  }

  // get tmdbConfig and store in state
  if (!store.tmdbConfig) store.updateTmdbConfig(await getImageUrls());

  if (store.$state.tmdbConfig) {
    backgroundInfo.value = await getAppBackgroundImg(store.$state.tmdbConfig);
    store.updateBackgroundInfo(backgroundInfo.value);
  }
});
</script>

<template>
  <div
    class="bg-no-repeat bg-fixed bg-cover bg-center h-full flex"
    :style="{ backgroundImage: `url(${backgroundInfo?.backgroundUrl})` }"
  >
    <aside v-if="$q.screen.xs === false" class="p-2 pr-0 w-[250px]">
      <div class="relative bg-black/50 rounded-md h-full overflow-hidden">
        <a
          href="/"
          class="flex justify-center hover:no-underline backdrop-blur-md"
        >
          <img
            :src="traktLogo"
            class="self-start object-contain max-w-14 mt-4 -mr-2"
          />
          <span class="self-center text-9xl">/</span>
          <img
            :src="vuejsLogo"
            class="self-end object-contain max-w-14 mb-4 -ml-2"
          />
        </a>

        <div
          class="relative w-full h-40 bg-cover bg-center"
          :style="{
            backgroundImage: `url(${
              store.myInfo?.account.cover_image
                ? `${store.myInfo?.account.cover_image}.webp`
                : defaultBack
            })`,
          }"
        >
          <div
            v-if="store.myInfo"
            class="absolute w-full bottom-0 bg-black/50 p-3 flex items-center"
          >
            <div>
              <img
                :src="store.myInfo?.user.images.avatar.full"
                :alt="store.myInfo?.user.name"
                referrerpolicy="no-referrer"
                class="h-12 mr-2 rounded-full outline outline-2 outline-white/75"
              />
            </div>
            <div>
              <div class="font-bold">
                {{ store.myInfo?.user.name }}
              </div>
              <div>
                <a
                  :href="`https://trakt.tv/users/${store.myInfo?.user.username}`"
                  target="blank"
                >
                  @{{ store.myInfo?.user.username }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <VerticalMenu :filters="filterOptions" />

        <div class="absolute bottom-0 left-0 right-0 p-3">
          <h1 class="text-sm uppercase text-dark-list font-semibold">
            Background
          </h1>
          <Button img>
            <img
              v-if="backgroundInfo.posterUrl"
              :src="backgroundInfo.posterUrl"
              :alt="backgroundInfo.title"
              referrerpolicy="no-referrer"
              class="inline-block"
            />
            <span v-else>{{ backgroundInfo.title }}</span>
          </Button>
        </div>
      </div>
    </aside>

    <div class="grow flex flex-col w-full">
      <Header :page="store.$state.page" />

      <div v-if="!store.loaded" class="grow p-2">
        <div
          class="bg-black/50 h-full w-full flex items-center justify-center rounded-md"
        >
          <LoaderFingers />
        </div>
      </div>

      <div :class="{ hidden: !store.loaded }" class="grow">
        <router-view />
      </div>
    </div>
  </div>
</template>
