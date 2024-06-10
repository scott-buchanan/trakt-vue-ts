<script setup lang="ts">
// TODO: add error handling
const error: Ref<boolean> = ref(false)
</script>

<template>
  <div class="p-2 w-full h-full">
    <div class="w-full h-full rounded-md bg-black/50 flex justify-center items-center">
      <iconify-icon v-if="!error" icon="line-md:loading-twotone-loop" width="6em" height="6em" />
      <div v-else>
        Something went wrong
      </div>
    </div>
  </div>
</template>
