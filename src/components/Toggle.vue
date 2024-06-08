<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

function handleClick() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div class="relative w-10">
    <button class="flex flex-nowrap w-full" @click="handleClick">
      <div
        class="rounded-full h-6 w-6 z-20 transition-all duration-200 ease-in-out"
        :class="modelValue ? 'bg-pprimary translate-x-3/4' : 'bg-slate-200 translate-x-0'"
      />
      <div
        class="absolute top-1/2 -translate-y-1/2 h-4 w-full bg-gray-500 rounded-full z-10"
      />
    </button>
  </div>
</template>
