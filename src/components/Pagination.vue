<script setup lang="ts">
export interface Props {
  data: any
  currentPage: number
  pagesVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  pagesVisible: 5,
})
const emit = defineEmits(['click'])

// static
const containerWidth = props.pagesVisible * 2.75

// refs
const animationDuration: Ref<number> = ref(200)

watch(
  () => props.currentPage,
  (newPage, oldPage) => {
    animationDuration.value = Math.min(Math.max(Math.abs(newPage - oldPage) * 50, 200), 1000)
  },
)

// computed
const actualWidth = computed(() => props.data?.pagesTotal * 44)
const transform = computed(() => {
  if (props.currentPage < 2)
    return props.currentPage * 2.75 - 2.75
  return props.currentPage === 1 ? 0 : props.currentPage * 2.75 - 2.75 * 3
})
const firstPageButtonDisabled = computed(() => props.currentPage <= 3)
const lastPageButtonDisabled = computed(() => props.data?.pagesTotal - props.currentPage < 3)
const jumpTenBackButtonDisabled = computed(() => props.currentPage - 10 < 1)
const jumpTenForwardButtonDisabled = computed(() => props.currentPage + 10 > props.data?.pagesTotal)
const prevButtonPosition = computed(() => (firstPageButtonDisabled.value ? 2.75 : 0))
const nextButtonPosition = computed(() => (lastPageButtonDisabled.value ? -2.75 : 0))

function goToPage(page: number, disabled: boolean = false) {
  if (disabled)
    return
  emit('click', { page })
}
</script>

<template>
  <div v-if="data" class="flex justify-center">
    <div class="flex w-full justify-center">
      <div class="flex items-end text-lg">
        <button
          class="h-11 w-11 mx-1 rounded-md hover:bg-white/20 transition-transform ease-in-out duration-300"
          :class="[{ disabled: currentPage === 1 }, { 'delay-100': firstPageButtonDisabled }]"
          :style="{
            transform: `translateX(${prevButtonPosition}rem)`,
          }"
          @click="goToPage(currentPage - 1, currentPage === 1)"
        >
          <iconify-icon icon="mdi:chevron-left" height="2.5em" width="2.5em" />
        </button>

        <div class="h-11 w-11">
          <div class="p-0.5 h-full w-full">
            <button
              class="w-full h-full rounded-md hover:bg-white/20 transition-all"
              :class="[
                { 'opacity-0': firstPageButtonDisabled },
                { 'pointer-events-none': firstPageButtonDisabled },
              ]"
              @click="goToPage(1)"
            >
              1
            </button>
          </div>
        </div>
        <div class="h-11 w-11">
          <div class="p-0.5 h-full w-full">
            <button
              class="w-full h-full rounded-md hover:bg-white/20 transition-all"
              :class="[{ disabled: jumpTenBackButtonDisabled }]"
              @click="goToPage(Math.max(currentPage - 10, 1), jumpTenBackButtonDisabled)"
            >
              ...
            </button>
          </div>
        </div>

        <div class="h-11 overflow-hidden" :style="{ width: `${containerWidth}rem` }">
          <div
            class="flex flex-nowrap transition-transform ease-in-out"
            :style="{
              width: `${actualWidth}px`,
              transform: `translateX(-${transform}rem)`,
              transitionDuration: `${animationDuration}ms`,
            }"
          >
            <div v-for="page in data?.pagesTotal" :key="page" class="h-11 w-11">
              <div class="p-0.5 h-full w-full">
                <div
                  v-if="currentPage === page"
                  class="w-full h-full rounded-md bg-pprimary font-bold text-dark flex justify-center items-center"
                >
                  {{ page }}
                </div>
                <button
                  v-else
                  class="w-full h-full rounded-md hover:bg-white/20"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="h-11 w-11">
          <div class="p-0.5 h-full w-full">
            <button
              class="h-full w-full rounded-md hover:bg-white/20"
              :class="{ disabled: jumpTenForwardButtonDisabled }"
              @click="
                goToPage(Math.min(currentPage + 10, data?.pagesTotal), jumpTenForwardButtonDisabled)
              "
            >
              ...
            </button>
          </div>
        </div>

        <div class="h-11 w-11">
          <div class="p-0.5 h-full w-full">
            <button
              class="h-full w-full rounded-md hover:bg-white/20 transition-opacity"
              :class="[
                { 'opacity-0': lastPageButtonDisabled },
                { 'pointer-events-none': lastPageButtonDisabled },
                { 'delay-200': !lastPageButtonDisabled },
              ]"
              @click="goToPage(data?.pagesTotal)"
            >
              {{ data?.pagesTotal }}
            </button>
          </div>
        </div>

        <button
          class="h-11 w-11 mx-1 rounded-md hover:bg-white/20 transition-transform ease-in-out duration-300"
          :class="[
            { disabled: currentPage === data?.pagesTotal },
            { 'delay-100': lastPageButtonDisabled },
          ]"
          :style="{
            transform: `translateX(${nextButtonPosition}rem)`,
          }"
          @click="goToPage(currentPage + 1, currentPage === data?.pagesTotal)"
        >
          <iconify-icon icon="mdi:chevron-right" height="2.5em" width="2.5em" />
        </button>
      </div>
    </div>
  </div>
</template>
