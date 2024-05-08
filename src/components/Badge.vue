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
});
</script>

<template>
  <span
    :class="[
      outline
        ? 'outline outline-1 outline-pprimary text-pprimary'
        : 'bg-pprimary text-slate-900',
    ]"
    class="text-xs rounded px-1 py-px"
  >
    {{ value }}
  </span>
</template>
