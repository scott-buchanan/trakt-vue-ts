<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  src: string
  alt?: string
  ariaHidden?: boolean
}>(), {
  alt: '',
  ariaHidden: false,
})

const imgLoaded: Ref<boolean> = ref(false)

function imageLoaded() {
  imgLoaded.value = true
}
</script>

<template>
  <img
    v-if="!$slots.default"
    v-bind="$attrs"
    :src
    :alt
    :aria-hidden
    class="transition-opacity duration-700"
    :class="imgLoaded ? 'opacity-100' : 'opacity-0'"
    @load="imageLoaded"
  >
  <div v-else class="relative overflow-hidden" v-bind="$attrs">
    <img
      :src
      :alt
      :aria-hidden
      class="transition-opacity duration-700"
      :class="imgLoaded ? 'opacity-100' : 'opacity-0'"
      @load="imageLoaded"
    >
    <slot />
  </div>
</template>
