<script setup lang="ts">
withDefaults(defineProps<{
  bgTransparent: boolean
}>(), {
  bgTransparent: false,
})

const scrollParent: Ref<HTMLDivElement | null> = ref(null)
const scrollDiv: Ref<HTMLDivElement | null> = ref(null)
const scrollBar: Ref<HTMLDivElement | null> = ref(null)
const scrollPos: Ref<number> = ref(0)
const timeout: Ref<ReturnType<typeof setTimeout> | null> = ref(null)
const isScrolling: Ref<boolean> = ref(false)
const displayScrollbar: Ref<boolean> = ref(true)

// methods
function updateScrollPosition() {
  if (!scrollDiv.value || !scrollParent.value || !scrollBar.value)
    return

  clearTimeout(timeout.value as ReturnType<typeof setTimeout>)
  isScrolling.value = true

  // height of the outer most div that we are using as a scroll container
  const parentHeight = scrollParent.value.offsetHeight
  // height tall inner div that contains content we want to scroll
  const maxScrollHeight = scrollDiv.value.scrollHeight - scrollDiv.value.clientHeight
  const scrollPercentage = (scrollDiv.value.scrollTop / maxScrollHeight) * 100
  const indicatorTopPosition = (scrollPercentage / 100) * (parentHeight - scrollBar.value.clientHeight)

  scrollPos.value = Math.max(0, Math.min(indicatorTopPosition, parentHeight - scrollBar.value.clientHeight))

  timeout.value = setTimeout(() => {
    isScrolling.value = false
  }, 400)
}
function checkDisplayBar() {
  return displayScrollbar.value = scrollParent.value?.offsetHeight !== scrollDiv.value?.scrollHeight
}

// lifecycle methods
onMounted(() => {
  scrollDiv.value?.addEventListener('scroll', updateScrollPosition)
  window.addEventListener('resize', checkDisplayBar)
})
onUnmounted(() => {
  scrollDiv.value?.removeEventListener('scroll', updateScrollPosition)
  window.removeEventListener('resize', checkDisplayBar)
})
onUpdated(() => {
  checkDisplayBar()
})
</script>

<template>
  <div ref="scrollParent" class="group/scroll relative h-full w-full rounded-md overflow-hidden">
    <div
      ref="scrollBar"
      class="absolute bottom-0 right-0 transition-opacity duration-500 opacity-0 group-hover/scroll:opacity-100 w-[10px] h-1/4 z-10 rounded-md"
      :class="{ 'bg-black/50': displayScrollbar }"
      :style="{ top: `${scrollPos}px`, opacity: isScrolling ? '1' : '' }"
    />
    <div ref="scrollDiv" class="absolute h-full w-full overflow-auto no-scrollbar" :class="{ 'bg-black/50': !bgTransparent }">
      <slot />
    </div>
  </div>
</template>
