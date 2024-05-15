<script setup lang="ts">
import * as emoji from 'node-emoji'
import dayjs from 'dayjs'
import { useQuasar } from 'quasar'
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

const $q = useQuasar()
const reviewsMore: Ref<boolean> = ref(false)
const reviewReplies = ref({})
const reviewSeeMore = ref([])
const showUnrated = ref(false)
const showUnratedButton = ref(true)
const likes = ref(JSON.parse(localStorage.getItem('trakt-vue-likes')!))
const user = localStorage.getItem('trakt-vue-user')

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
    else current.likes += 1

    $q.notify({
      message: deleteLike ? 'Like removed' : 'Like added',
      position: 'top',
      icon: 'o_done',
      iconColor: 'green',
      badgeColor: 'secondary',
      badgeTextColor: 'dark',
      progress: true,
      timeout: 2500,
    })
  }
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
          <q-badge color="secondary" class="text-dark">
            {{ props.reviewCount }}
          </q-badge>
        </sup>
      </h2>
      <div v-if="showUnratedButton" class="unrated-toggle">
        Unrated
        <q-toggle
          v-model="showUnrated"
          class="q-ml-xs"
          color="secondary"
          dark
          dense
        />
      </div>
    </div>
    <div class="grid grid-cols-2 grid-cols-sm-1 gap-4">
      <div v-for="review in truncateReviews" :key="review.id">
        <div class="flex items-center">
          <div
            class="flex q-mb-sm"
            :class="[{ 'full-width wrap ': !$q.screen.gt.sm }]"
          >
            <q-avatar class="q-mr-sm">
              <q-img :src="review.avatar" alt="" referrerpolicy="no-referrer" />
            </q-avatar>
            <div class="username">
              {{ review.user?.name ? review.user.name : review.user.username
              }}<br>
              <small>{{ formattedDate(review.created_at) }}</small>
            </div>
          </div>
          <q-space />
          <div
            class="column"
            :class="[$q.screen.gt.sm ? 'items-end' : 'items-start']"
          >
            <div
              v-show="review.user_rating || review.user_stats?.rating"
              class="review-rating q-mb-sm"
              :class="[$q.screen.gt.sm ? 'justify-end' : 'justify-start']"
            >
              <div>
                <q-icon
                  name="o_star"
                  color="yellow"
                  size="1.5em"
                  class="star"
                />
              </div>
              <div>
                <span>
                  {{
                    review.userating
                      ? review.user_rating
                      : review.user_stats?.rating
                  }}
                </span>
                <small>&nbsp;/10</small>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-end">
          <div class="q-mr-sm">
            <q-btn
              v-if="user"
              :icon="
                likedReview(review) ? 'o_thumb_up_alt' : 'o_thumb_up_off_alt'
              "
              color="secondary"
              size="md"
              flat
              dense
              round
              :ripple="false"
              @click="likeReview(review)"
            />
            <q-icon
              v-else
              name="o_thumb_up_off_alt"
              color="secondary"
              size="24px"
            />
            {{ review.likes === 1 ? review.likes : review.likes }}
          </div>
          <div v-if="review.replies > 0">
            <q-btn
              class="review-likes-comments"
              flat
              dense
              no-caps
              :ripple="false"
              @click="getReplies(review)"
            >
              <q-icon
                class="q-pr-xs"
                name="o_comment"
                size="24px"
                color="secondary"
              />
              {{ review.replies === 1 ? review.replies : review.replies }}
              <q-icon
                :class="
                  reviewReplies[review.id]?.show ? 'expand-less' : 'expand-more'
                "
                name="o_expand_less"
                size="xs"
                color="white"
              />
            </q-btn>
          </div>
          <div v-else>
            <q-icon
              class="q-pr-xs"
              name="o_comment"
              size="24px"
              color="secondary"
            />
            {{ `${review.replies} replies` }}
          </div>
        </div>
        <div
          v-if="formatReviews(review.comment).length > 400"
          class="review-bubble q-pa-md"
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
        <div v-else class="review-bubble q-pa-md">
          {{ formatReviews(review.comment) }}
        </div>
        <Reviews
          v-if="reviewReplies[review.id]?.show"
          reply
          :reviews="reviewReplies[review.id]?.replies"
          class="review-reply"
        />
        <div class="text-right">
          <q-btn
            v-if="filteredReviews.length > 2"
            color="secondary"
            outline
            no-caps
            size="md"
            :icon-right="reviewsMore ? 'o_expand_less' : 'o_expand_more'"
            :label="reviewsMore ? 'See Less' : 'See More'"
            @click="reviewsMore = !reviewsMore"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "~/quasar-variables.scss";

// needed to override timeline heading
:deep(h2) {
  @include heading-reset;
}
sup {
  font-weight: 400;
  font-size: 0.6em;
  @include darkText;
}
:deep(.q-timeline__dot) {
  top: 10px;
}
:deep(.q-timeline__subtitle) {
  opacity: 1;
  color: $accent;
}
:deep(.q-timeline__content) {
  margin-top: -10px;
}
.review-rating {
  display: flex;
  align-items: center;
  width: 100px;
  & > div {
    font-size: 1.8em;
    color: white;
    & > small {
      margin-left: -5px;
    }
    & .star {
      opacity: 1;
      margin-right: 2px;
    }
  }
}
.username {
  max-width: 180px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.review-likes-comments {
  & .expand-more {
    rotate: 180deg;
    transition: rotate 0.5s;
  }
  & .expand-less {
    rotate: 0deg;
    transition: rotate 0.2s;
  }
}
.unrated-toggle {
  margin-right: 5px;
  @include darkText;
}
.review-reply {
  margin-top: 20px;
  & :deep(.q-timeline__dot) {
    display: none;
  }
  & ul {
    margin-bottom: 0;
  }
}
.review-bubble {
  @include background-style;
  position: relative;
  &::before {
    // layout
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    bottom: 100%;
    left: 13px; // offset should move with padding of parent
    border: 0.75rem solid transparent;
    border-top: none;
    border-bottom-color: rgba(0, 0, 0, $opacity-back);
  }
}
</style>
