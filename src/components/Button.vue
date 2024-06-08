<script setup lang="ts">
export interface Props {
  img?: boolean
  label?: string
}

withDefaults(defineProps<Props>(), {
  img: false,
})
</script>

<template>
  <button
    :class="{
      'px-4 border border-solid border-white/25 bg-black/50 backdrop-blur-sm rounded-full uppercase text-xs':
        !img,
    }"
  >
    {{ label }}
    <slot />
  </button>
</template>
