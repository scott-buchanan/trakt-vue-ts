<script setup lang="ts">
const scrollParent: Ref<HTMLDivElement | null> = ref(null)
const scrollDiv: Ref<HTMLDivElement | null> = ref(null)
const scrollBar: Ref<HTMLDivElement | null> = ref(null)
const scrollPos: Ref<number> = ref(0)
const timeout: Ref<ReturnType<typeof setTimeout> | null> = ref(null)
const isScrolling: Ref<boolean> = ref(false)

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

onMounted(() => {
  scrollDiv.value?.addEventListener('scroll', updateScrollPosition)
})

onUnmounted(() => {
  scrollDiv.value?.removeEventListener('scroll', updateScrollPosition)
})
</script>

<template>
  <div ref="scrollParent" class="group/scroll relative h-full w-full rounded-md overflow-hidden">
    <div
      ref="scrollBar"
      class="absolute bottom-0 right-0 bg-black/50 transition-opacity duration-500 opacity-0 group-hover/scroll:opacity-100 w-[10px] h-1/4 z-10 rounded-md"
      :style="{ top: `${scrollPos}px`, opacity: isScrolling ? '1' : '' }"
    />
    <div ref="scrollDiv" class="absolute bg-black/50 h-full w-full overflow-auto no-scrollbar">
      <slot />
    </div>
  </div>
</template>
