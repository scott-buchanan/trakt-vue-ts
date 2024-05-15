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
  <div class="q-mb-lg">
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
      class="inline-block q-pl-none q-py-xs q-pr-md"
    >
      <span class="text-dark-list uppercase q-mr-sm">{{ item.label }}:</span>
      <span class="q-mr-sm">{{ item.value }}</span>
    </div>
  </div>
</template>
