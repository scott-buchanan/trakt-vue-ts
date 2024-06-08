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
  <div class="mb-6">
    <table v-if="stacked">
      <tr v-for="item in items" :key="JSON.stringify(item)">
        <td class="text-dark-list uppercase pb-1 pr-2">
          {{ item.label }}:
        </td>
        <td>{{ item.value }}</td>
      </tr>
    </table>
    <div
      v-for="item in items"
      v-else
      :key="JSON.stringify(item)"
      class="inline-block pl-0 py-1 pr-4"
    >
      <span class="text-dark-list uppercase mr-2">{{ item.label }}:</span>
      <span class="mr-2">{{ item.value }}</span>
    </div>
  </div>
</template>
