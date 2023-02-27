<script setup lang="ts">
import ActorImage from '~/components/ActorImage.vue'
// types
import type Tmdb from '~/api/tmdb.types'

interface Props {
  horizontal?: boolean
  actors: Tmdb.Actor[]
}

withDefaults(defineProps<Props>(), {
  horizontal: false,
})
</script>

<template>
  <template v-if="actors.length > 0">
    <div v-if="horizontal" class="actors-container-small q-mb-sm">
      <div class="full-height">
        <q-scroll-area class="full-height" dark>
          <h1>Starring</h1>
          <div class="flex no-wrap q-pb-sm">
            <div
              v-for="(actor, index) in actors" :key="actor.ids.trakt"
              class="actor-small"
              :class="[{ 'q-mr-md': index !== actors.length - 1 }]"
            >
              <ActorImage :actor="actor" small />
            </div>
          </div>
        </q-scroll-area>
      </div>
    </div>
    <div v-else class="actors-container text-white q-pl-sm">
      <q-scroll-area
        class="actors-container-scroll full-height full-width q-pa-sm"
        :thumb-style="{ opacity: '0.5' }"
      >
        <h1>Starring</h1>
        <div
          v-for="(actor, index) in actors"
          :key="actor.ids.trakt"
          :class="{ 'q-mb-sm': index !== actors.length - 1 }"
        >
          <ActorImage :actor="actor" />
        </div>
        <q-btn label="See All" class="full-width q-mt-sm" :ripple="false" flat />
      </q-scroll-area>
    </div>
  </template>
</template>

<style lang="scss" scoped>
@import '~/quasar-variables.scss';

.actors-container {
  width: 200px;
  & > .actors-container-scroll {
    @include background-style;
  }
}
.actors-container-small {
  height: 210px;
  color: white;
  width: 100%;
  position: relative;
  & .actor-small {
    width: 100px;
  }
}
</style>
