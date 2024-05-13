<script setup lang="ts">
export interface Props {
  value: string;
  top?: boolean;
}

withDefaults(defineProps<Props>(), {
  top: false,
});

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
    class="absolute -ml-1 left-1/2 -translate-x-1/2 mt-2 text-xs bg-slate-900/95 text-nowrap p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity delay-200 z-50"
  >
    <div class="relative">
      <div
        class="h-2 w-2 bg-slate-900/95 absolute rotate-45 left-1/2 -translate-x-1/2"
        :class="top ? '-bottom-3' : '-top-3'"
      />
      {{ value }}
    </div>
  </div>
</template>
