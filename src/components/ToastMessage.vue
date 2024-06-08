<script setup lang="ts">
const props = defineProps<{
  showMessage: boolean
  message: string
}>()
const emit = defineEmits(['close'])
// refs
const countDownWidth: Ref<number> = ref(100) // ms

watch(() => props.showMessage, (newVal) => {
  if (newVal) {
    const verstappen = setInterval(() => {
      countDownWidth.value = countDownWidth.value - 1
      if (countDownWidth.value === 0) {
        clearInterval(verstappen)
        countDownWidth.value = 100
        emit('close')
      }
    }, 50)
  }
})
</script>

<template>
  <div
    class="w-48 fixed top-4 mx-auto inset-x-0 -translate-y-20 z-50 bg-slate-900 text-center text-white font-semibold rounded-md
           transition-transform duration-700 ease-in-out overflow-hidden"
    :style="showMessage ? { transform: 'translateY(0)' } : ''"
  >
    <div class="relative p-3">
      {{ message }}
      <div v-if="showMessage" class="h-0.5 absolute left-0 bottom-0 bg-green-600 transition-all" :style="{ width: `${countDownWidth}%` }" />
    </div>
  </div>
</template>
