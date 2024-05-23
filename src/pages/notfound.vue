<script setup lang="ts">
import { useStore } from '~/stores/mainStore'

const store = useStore()
store.updateLoading(true)
</script>

<template>
  <div class="q-px-sm q-pb-sm full-height">
    <div class="background text q-pa-sm">
      <span class="full-width">
        <b class="bigger">404</b><br>
        not found
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Play:wght@400;700&display=swap");

.background {
  &.text {
    font-family: Play, sans-serif;
    font-size: min(5vw, 250px);
    display: flex;
    align-items: center;
    text-align: center;
    line-height: 1em;
    & .bigger {
      font-size: 2em;
    }
  }
  background-color: rgba(0, 0, 0, $opacity-back) !important;
  height: 100%;
  border-radius: 5px;
}
</style>
