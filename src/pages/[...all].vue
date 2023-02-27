<script setup lang="ts">
import { useStore } from '~/store/index'

const store = useStore()
store.updateLoading(true)
</script>

<template>
  <div class="q-px-sm q-pb-sm full-height">
    <div class="background q-pa-sm">
      Not Found
    </div>
  </div>
</template>

<style lang="scss" scoped>
.background {
      background-color: rgba(0, 0, 0, $opacity-back) !important;
      height: 100%;
      border-radius: 5px;
}
</style>
