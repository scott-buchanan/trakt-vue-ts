<script setup lang="ts">
defineProps({
  value: {
    type: String,
    default: null,
  },
  outline: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <span
    :class="[
      outline
        ? 'outline outline-1 outline-pprimary text-pprimary'
        : 'bg-pprimary text-slate-900',
    ]"
    class="rounded py-px px-1"
  >
    {{ value }}
    <slot />
  </span>
</template>
