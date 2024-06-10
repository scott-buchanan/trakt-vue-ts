<script setup lang="ts">
import * as emoji from 'node-emoji'
import dayjs from 'dayjs'
import type Trakt from '~/api/trakt.types'

// api
import { getComments, likeComment } from '~/api/trakt'

interface Props {
  reviews: Trakt.Comment[]
  reviewCount: string
  reply?: boolean
  mType: string | null
}
const props = withDefaults(defineProps<Props>(), {
  reviewCount: '0',
  reply: false,
  mType: null,
})

const reviewsMore: Ref<boolean> = ref(false)
const reviewReplies = ref({})
const reviewSeeMore = ref([])
const showUnrated = ref(false)
const showUnratedButton = ref(true)
const likes = ref(JSON.parse(localStorage.getItem('trakt-vue-likes')!))
const user = localStorage.getItem('trakt-vue-user')
const likeAddedSuccess: Ref<boolean> = ref(false)
const likeAddedMessage: Ref<string> = ref('')

const filteredReviews = computed(() => {
  if (showUnrated.value || props.reply)
    return props.reviews
  return props.reviews?.filter(comment => comment.user_rating !== null)
})
const truncateReviews = computed(() =>
  reviewsMore.value ? filteredReviews.value : filteredReviews.value.slice(0, 2),
)

async function getReplies(review) {
  if (!reviewReplies.value[review.id]) {
    const replies = await getComments(review.id, props.mType, true)
    reviewReplies.value[review.id] = { show: true, replies }
  }
  else {
    reviewReplies.value[review.id].show = !reviewReplies.value[review.id].show
  }
}

function likedReview(review) {
  return likes.value?.find(like => like.comment.id === review.id)
}
async function likeReview(review) {
  const deleteLike = likedReview(review)
  const success = await likeComment(review.id, deleteLike)
  if (deleteLike) { likes.value = likes.value.filter(item => item.comment.id !== review.id) }
  else {
    likes.value.push({
      liked_at: new Date().toISOString(),
      comment: { id: review.id },
    })
  }

  if (success) {
    const current = props.reviews.find(item => item.id === review.id)
    if (deleteLike)
      current.likes -= 1
    else
      current.likes += 1

    likeAddedSuccess.value = true
    likeAddedMessage.value = deleteLike ? 'Like removed' : 'Like added'
  }
}
function closeToast() {
  likeAddedSuccess.value = false
}
function truncateReviewCard(text, length) {
  return `${text.substring(0, length)}...`
}
function formatReviews(text) {
  return emoji
    .emojify(text)
    .replaceAll('[spoiler]', '')
    .replaceAll('[/spoiler]', '')
}
function formattedDate(wDate) {
  return dayjs(wDate).format('MMM DD, YYYY')
}
function toggleActive(review) {
  if (review.id in reviewSeeMore.value)
    reviewSeeMore.value[review.id] = !reviewSeeMore.value[review.id]
  else reviewSeeMore.value[review.id] = true
}

// lifecycle hooks
onMounted(() => {
  if (!props.reply) {
    const onlyRated = props.reviews.filter(
      review => review.user_rating !== null,
    )
    if (onlyRated.length < 1) {
      showUnrated.value = true
      showUnratedButton.value = false
    }
  }
})
</script>

<template>
  <div v-if="props.reviews?.length > 0" color="secondary" dark>
    <div
      v-if="props.reply === false"
      class="flex items-start justify-between no-wrap"
    >
      <h2>
        User Reviews
        <sup>
          <Badge class="p-0.5 text-xs font-medium">
            {{ props.reviewCount }}
          </Badge>
        </sup>
      </h2>
      <div v-if="showUnratedButton" class="flex mr-1 uppercase text-dark-list font-light">
        Unrated
        <Toggle v-model="showUnrated" class="ml-2" />
      </div>
    </div>
    <div class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-4 mt-3">
      <div v-for="review in truncateReviews" :key="review.id" class="inline-block break-inside-avoid">
        <div class="flex items-center justify-between">
          <div
            class="flex mb-2 w-full sm:w-auto sm:flex-wrap mr-2"
          >
            <img :src="review.avatar" alt="" referrerpolicy="no-referrer" class="mr-2 w-10 h-10 rounded-full">
            <div class="max-w-44 overflow-hidden ellipsis whitespace-nowrap leading-5">
              {{ review.user?.name ? review.user.name : review.user.username
              }}<br>
              <small class="text-xs">{{ formattedDate(review.created_at) }}</small>
            </div>
          </div>

          <div
            class="items-start sm:items-end"
          >
            <div
              v-show="review.user_rating || review.user_stats?.rating"
              class="flex items-center w-28 justify-start sm:justify-end mb-2"
            >
              <div class="text-3xl">
                <iconify-icon
                  icon="material-symbols:star"
                  width="1.2em"
                  height="1.2em"
                  class="text-yellow-400"
                />
              </div>
              <div class="text-3xl font-semibold">
                <span>
                  {{
                    review.userating
                      ? review.user_rating
                      : review.user_stats?.rating
                  }}
                </span>
                <small class="ml-0.5 font-extralight">/10</small>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-end mb-2">
          <div class="mr-2 flex justify-center items-center">
            <button v-if="user" class="mr-1" @click="likeReview(review)">
              <iconify-icon
                :icon="likedReview(review) ? 'ic:baseline-thumb-up' : 'ic:outline-thumb-up-alt'"
                width="1.5em"
                height="1.5em"
              />
            </button>
            <iconify-icon v-else icon="ic:outline-thumb-up-off-alt" width="1.5em" height="1.5em" />
            {{ review.likes === 1 ? review.likes : review.likes }}
          </div>
          <div v-if="review.replies > 0">
            <button class="flex justify-center items-center" @click="getReplies(review)">
              <iconify-icon icon="material-symbols:comment" width="1.5em" height="1.5em" class="mr-1" />
              <span class="mr-1">{{ review.replies === 1 ? `${review.replies} reply` : `${review.replies} replies` }}</span>
              <iconify-icon
                icon="ion:chevron-down"
                :class="reviewReplies[review.id]?.show ? 'rotate-0 transition-transform' : 'rotate-180 transition-transform'"
                width="1.5em"
                height="1.5em"
              />
            </button>
          </div>
          <div v-else class="flex justify-center items-center">
            <iconify-icon icon="material-symbols:comment" width="1.5em" height="1.5em" class="mr-1" />
            {{ `${review.replies} replies` }}
          </div>
        </div>

        <div
          v-if="formatReviews(review.comment).length > 400"
          class="relative p-4 rounded-md bg-black/50"
        >
          {{
            reviewSeeMore[review.id] === true
              ? formatReviews(review.comment)
              : truncateReviewCard(formatReviews(review.comment), 400)
          }}
          <button role="link" @click="toggleActive(review)">
            {{ reviewSeeMore[review.id] === true ? "Read less" : "Read more" }}
          </button>
        </div>
        <div v-else class="relative p-4 rounded-md bg-black/50">
          {{ formatReviews(review.comment) }}
        </div>

        <Reviews
          v-if="reviewReplies[review.id]?.show"
          reply
          :reviews="reviewReplies[review.id]?.replies"
          class="mt-5"
        />
      </div>
    </div>

    <div class="flex justify-end">
      <Button class="py-3 mt-3 flex items-center rounded-md" @click="reviewsMore = !reviewsMore">
        <iconify-icon
          icon="ion:chevron-down"
          :class="!reviewsMore ? 'rotate-0 transition-transform' : 'rotate-180 transition-transform'"
          width="1.5em"
          height="1.5em"
          class="mr-1"
        />
        {{ reviewsMore ? 'See Less' : 'See More' }}
      </Button>
    </div>
    <ToastMessage :show-message="likeAddedSuccess" :message="likeAddedMessage" @close="closeToast" />
  </div>
</template>
