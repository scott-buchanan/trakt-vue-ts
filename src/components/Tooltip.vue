<script setup lang="ts">
export interface Props {
  value: string
  top?: boolean
}

withDefaults(defineProps<Props>(), {
  top: false,
})

const tooltip: Ref<HTMLElement | null> = ref(null)
const position: Ref<Pick<DOMRect, 'top' | 'left' | 'height' | 'width'>> = ref({ top: 0, left: 0, height: 0, width: 0 })

watch(() => tooltip.value?.previousSibling, async () => {
  // fixes random position issues
  requestAnimationFrame(() => {
    const parentElem = tooltip.value?.parentElement
    const anchorElem = tooltip.value?.previousSibling
    if (anchorElem instanceof HTMLElement && (anchorElem.getBoundingClientRect()?.top !== 0 && anchorElem.getBoundingClientRect()?.left !== 0)) {
      position.value = anchorElem.getBoundingClientRect()
      if (parentElem)
        parentElem.classList.add('group/tooltip')
    }
  })
})
</script>

<template>
  <div
    ref="tooltip"
    class="fixed text-xs bg-slate-900/95 text-nowrap p-2 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity delay-200 z-50 overflow-visible"
    :style="{ top: `${position.top - position.height}px`, left: `${position.left - position.width}px` }"
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
