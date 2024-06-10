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
  <div>
    <a v-if="actor.ids.imdb" :href="`https://imdb.com/name/${actor.ids.imdb}`" target="blank">
      <div class="relative">
        <img
          :src="actor.profile_path ? actor.profile_path : noActorImage"
          :alt="actor.name"
          class="rounded-md"
          :class="small ? 'h-36' : 'h-64'"
        >
        <div
          class="absolute bottom-0 w-full bg-black/50 rounded-b-md"
          :class="[small ? 'text-xs font-thin p-1' : 'p-2']"
        >
          <strong class="block whitespace-nowrap overflow-hidden text-ellipsis leading-5">{{ actor.name }}</strong>
          <span v-if="actor.character" class="block text-xs leading-5">as {{ actor.character }}</span>
        </div>
      </div>
    </a>
    <div v-else class="relative">
      <img
        :src="actor.profile_path ? actor.profile_path : noActorImage"
        :alt="actor.name"
        class="rounded-md"
        :class="small ? 'h-36' : 'h-64'"
      >
      <div
        class="text-xs font-thin whitespace-nowrap overflow-hidden ellipsis absolute bottom-0 w-full p-1 bg-black/50 rounded-b-md"
        :class="[small ? 'text-xs font-thin p-1' : 'p-2']"
      >
        <strong>{{ actor.name }}</strong>
        <span v-if="actor.character">as {{ actor.character }}</span>
      </div>
    </div>
    <Tooltip v-if="small" :value="getActorTooltip" top />
  </div>
</template>
