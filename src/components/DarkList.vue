<script setup lang="ts">
interface Item {
  label: string
  value: string | number
}

defineProps({
  items: {
    type: Array as () => Item[],
    default: () => [],
  },
  stacked: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div>
    <div
      v-for="item in items"
      :key="JSON.stringify(item)"
      class="inline-block pl-0 py-1 pr-4 text-sm"
    >
      <span class="text-dark-list uppercase mr-2 font-light">{{ item.label }}:</span>
      <span class="mr-2">{{ item.value }}</span>
    </div>
  </div>
</template>
