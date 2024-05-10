<script setup lang="ts">
defineProps<{
  value: string;
}>();

const tooltip: Ref<HTMLElement | null> = ref(null);

onMounted(() => {
  const parent = tooltip.value?.parentNode;
  if (parent instanceof HTMLElement) {
    parent.classList.add("group", "relative");
  }
});
</script>

<!-- Must place these classes on parent: group relative -->

<template>
  <div
    ref="tooltip"
    class="absolute -ml-1 left-1/2 -translate-x-1/2 mt-2 text-xs bg-slate-600/80 text-nowrap p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity delay-200 z-50"
  >
    <div class="relative">
      <div
        class="h-2 w-2 bg-slate-600/80 absolute -top-3 rotate-45 left-1/2 -translate-x-1/2"
      />
      {{ value }}
    </div>
  </div>
</template>
