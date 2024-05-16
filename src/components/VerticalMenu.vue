<script setup lang="ts">
import { useStore } from '~/store/index'
import type { Filter, FilterOptions } from '~/store/models'

defineProps<{
  filters: FilterOptions
}>()

const route = useRoute()
const router = useRouter()
const store = useStore()

function getLabel(key: string | number) {
  if (key === 'show')
    return 'tv shows'
  else
    return 'movies'
}

function handleClick(item: Filter, filterType: string) {
  if (store.filter.val === item.val && store.filterType === filterType) {
    router.push({ path: route.path })
  }
  else {
    store.updateLoading(false)
    store.updateFilterType(filterType)
    store.updatePage(1)
    store.updateFilter(item)
    router.push({
      path: filterType === 'movie' ? `/movies/${item.val}` : `/tv/${item.val}`,
    })
  }
}
</script>

<template>
  <div v-for="(filter, key) in filters" :key="key">
    <h1 class="text-sm uppercase text-dark-list font-semibold p-3 mb-0 mt-6">
      {{ getLabel(key) }}
    </h1>
    <ul>
      <li
        v-for="(item, index) in filter"
        :key="index"
        role="button"
        class="px-3 py-2 hover:bg-slate-300/20 transition-all"
        :class="{
          'font-bold text-pprimary':
            store.filter.val === item.val && store.filterType === key,
        }"
        @click="handleClick(item, key)"
      >
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>
