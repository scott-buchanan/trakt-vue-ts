<script setup lang="ts">
import dayjs from 'dayjs'
import * as emoji from 'node-emoji'

interface Props {
  data: object // TODO define type
}
const props = withDefaults(defineProps<Props>(), {
  data: {},
})

const emit = defineEmits(['closeDialog'])

const reviewDiv = ref(null)

// computed
const userRatingStars = computed(() => {
  const arrStars = []
  let total
  if (props.data.review.userating)
    total = props.data.review.user_rating
  else
    total = props.data.review.user_stats.rating / 2

  const addHalf = (total * 2) % 2 !== 0
  for (let i = 0; i < total; i += 1)
    arrStars.push('full')

  if (addHalf)
    arrStars.splice(-1, 1, 'half')
  for (let i = arrStars.length; i < 5; i += 1)
    arrStars.push('empty')

  return arrStars
})

// methods
function getReviewHeight() {
  if (reviewDiv.value) {
    const height = reviewDiv.value.$el.clientHeight + 40
    return `${height}px`
  }
  return '300px'
}
function formatReview(text) {
  return emoji.emojify(text).replaceAll('[spoiler]', '').replaceAll('[/spoiler]', '')
}
function formattedDate(wDate) {
  return dayjs(wDate).format('MMM DD, YYYY')
}
function hideDialog() {
  emit('closeDialog')
}
</script>

<template>
  <q-dialog
    :model-value="props.data?.show"
    prompt
    @update:model-value="hideDialog()"
    @hide="hideDialog()"
  >
    <q-card class="review-card" close dark>
      <q-btn v-close-popup class="button-close" icon="o_close" flat round dense />
      <q-img height="200px" position="top" :src="props.data.background" />
      <q-item class="avatar-rating" dark>
        <q-item-section avatar>
          <q-avatar size="64px">
            <q-img
              :src="props.data.review.avatar"
              :alt="props.data.review.user.name ? props.data.review.user.name : props.data.review.user.username"
              referrerpolicy="no-referrer"
            />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="flex items-center q-mb-md">
            <div v-show="props.data.review.user_rating || props.data.review.user_stats.rating" class="q-mr-xs">
              <span>
                {{
                  props.data.review.userating ? props.data.review.user_rating : props.data.review.user_stats.rating
                }}
              </span>
              <small>&nbsp;/10</small>
            </div>
            <div
              v-for="star in userRatingStars"
              v-show="props.data.review.user_rating || props.data.review.user_stats.rating"
              :key="star"
            >
              <q-icon
                :name="star === 'full' ? 'o_star' : star === 'half' ? 'o_star_half' : 'o_star_outline'"
                color="yellow"
                size="1.5em"
              />
            </div>
            <div class="col-grow text-right">
              {{ formattedDate(props.data.review.created_at) }}
            </div>
          </q-item-label>
          <q-item-label caption class="flex justify-between">
            <div>
              {{ props.data.review.user.name ? props.data.review.user.name : props.data.review.user.username }}
            </div>
          </q-item-label>
        </q-item-section>
      </q-item>
      <div class="q-pb-md">
        <q-scroll-area :style="{ height: getReviewHeight(), maxHeight: '400px' }" dark>
          <q-item class="q-px-md q-pt-md">
            <q-item-section ref="reviewDiv">
              {{ formatReview(props.data.review.comment) }}
            </q-item-section>
          </q-item>
        </q-scroll-area>
      </div>
    </q-card>
  </q-dialog>
</template>

<style lang="scss" scoped>
.review-card {
  background: rgba(0, 0, 0, 1);
  overflow: hidden;
  width: 100%;
  box-shadow: 0px 0px 50px -10px rgba(255, 255, 255, 0.8);
  & > div:nth-child(3) {
    margin-top: -40px;
  }
  & .avatar-rating {
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.4) 0%,
      rgba(0, 0, 0, 0.4) 52%,
      transparent 52%,
      transparent 100%
    );
  }
  & .button-close {
    z-index: 1;
    position: absolute;
    top: 10px;
    right: 10px;
  }
}
</style>
