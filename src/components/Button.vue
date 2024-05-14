<script setup lang="ts">
export interface Props {
  img?: boolean;
}

withDefaults(defineProps<Props>(), {
  img: false,
});
</script>

<template>
  <button
    :class="{
      'px-4 border border-solid border-white/25 bg-black/50 backdrop-blur-sm rounded-full uppercase flex items-center text-xs':
        !img,
    }"
  >
    <slot />
  </button>
</template>
