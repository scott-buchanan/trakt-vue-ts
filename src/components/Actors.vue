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
    <div v-if="horizontal" class="h-52 w-full relative mb-2" v-bind="$attrs">
      <div class="h-full">
        <ScrollArea class="h-full">
          <h1>Starring</h1>
          <div class="flex flex-nowrap pb-2">
            <div
              v-for="(actor, index) in actors" :key="actor.ids.trakt"
              class="w-24"
              :class="[{ 'mr-4': index !== actors.length - 1 }]"
            >
              <ActorImage :actor="actor" small />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
    <div v-else class="w-48 pl-2" v-bind="$attrs">
      <ScrollArea
        class="h-full w-full"
      >
        <div class="p-2">
          <h1>Starring</h1>
          <div
            v-for="(actor, index) in actors"
            :key="actor.ids.trakt"
            :class="{ 'mb-2': index !== actors.length - 1 }"
          >
            {{ actor.popularity }}
            <ActorImage :actor="actor" />
          </div>
          <Button label="See All" class="w-full mt-2 p-3 text-center" />
        </div>
      </ScrollArea>
    </div>
  </template>
</template>
