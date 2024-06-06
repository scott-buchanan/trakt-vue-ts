<script setup lang="ts">
import noActorImage from '~/assets/no-actor.jpg'
// types
import type Tmdb from '~/api/tmdb.types'

interface Props {
  actor: Tmdb.Actor
  small?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  small: false,
})

const getActorTooltip = computed(() => `${props.actor.name} as ${props.actor.character}`)
</script>

<template>
  <a v-if="actor.ids.imdb" :href="`https://imdb.com/name/${actor.ids.imdb}`" target="blank">
    <q-img
      :ratio="1.5 / 1"
      class="actor-image" :class="[{ small }]"
      :src="actor.profile_path ? actor.profile_path : noActorImage"
      :alt="actor.name"
    >
      <div class="actor-image-text absolute-bottom flex column" :class="[{ small }]">
        <strong>{{ actor.name }}</strong>
        <span v-if="actor.character">as {{ actor.character }}</span>
      </div>
    </q-img>
  </a>
  <q-img
    v-else
    :ratio="1.5 / 1"
    class="actor-image" :class="[{ small }]"
    :src="actor.profile_path ? actor.profile_path : noActorImage"
    :alt="actor.name"
  >
    <div class="actor-image-text absolute-bottom q-pa-sm flex" :class="[{ small }]">
      <strong>{{ actor.name }}</strong>
      <span v-if="actor.character">as {{ actor.character }}</span>
    </div>
  </q-img>
  <q-tooltip v-if="small" :delay="500" anchor="top middle" self="center middle">
    {{ getActorTooltip }}
  </q-tooltip>
</template>

<style lang="scss" scoped>
@use 'sass:map';
/* @import '~/quasar-variables.scss'; */
.actor-image {
  border-radius: 5px;
  min-height: 264px;
  &.small {
    min-height: 150px;
  }
}
.actor-image-text {
  font-size: 0.85em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* padding-top: map.get($space-sm, x);
  padding-bottom: map.get($space-sm, x); */
  &.small {
    /* padding: map.get($space-sm, x); */
    & > strong {
      font-size: 1em;
    }
  }
  & strong {
    font-size: 1.3em;
  }
}
</style>
