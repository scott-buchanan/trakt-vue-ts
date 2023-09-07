<script setup lang="ts">
interface Props {
  oneRowLonger: boolean
}
const props = withDefaults(defineProps<Props>(), {
  oneRowLonger: false,
})
</script>

<template>
  <div class="card-container" :class="[props.oneRowLonger ? 'long-row' : 'short-row']">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@use "sass:map";
@import '~/quasar-variables.scss';

.card-container {
  display: grid;
  grid-gap: map.get($space-sm, x);
  grid-template-columns: repeat(1, 1fr);
  &.short-row {
    @media only screen and (min-width: $breakpoint-md) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  &.long-row {
    @media only screen and (min-width: $breakpoint-lg) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}
</style>
