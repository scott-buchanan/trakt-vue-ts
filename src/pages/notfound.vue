<script setup lang="ts">
import { useStore } from '~/stores/mainStore'

const store = useStore()
store.updateLoading(true)
</script>

<template>
  <div class="p-2 h-full w-full">
    <div class="pa-2 bg-black/50 rounded-md h-full w-full flex justify-center items-center">
      <div class="text-center text-4xl">
        <b class="font-bold text-8xl">404</b><br>
        not found
      </div>
    </div>
  </div>
</template>
