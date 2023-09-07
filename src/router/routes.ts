import FilterPage from '~/pages/tv/tv-filter.vue'
import ShowDetails from '~/pages/tv/show-details.vue'
import SeasonDetails from '~/pages/tv/season-details.vue'
import EpisodeDetails from '~/pages/tv/episode-details.vue'
import MovieFilter from '~/pages/movie/movie-filter.vue'
import MovieDetails from '~/pages/movie/movie-details.vue'
import NotFound from '~/pages/notfound.vue'

export default [
  {
    path: '/',
    name: 'home',
    redirect: { name: 'tv-filter', params: { filter: 'trending' } },
  },
  {
    path: '/tv/:filter',
    name: 'tv-filter',
    component: FilterPage,
  },
  {
    path: '/tv/show/:show',
    name: 'show-details',
    component: ShowDetails,
  },
  {
    path: '/tv/show/:show/season/:season',
    name: 'season-details',
    component: SeasonDetails,
  },
  {
    path: '/tv/show/:show/season/:season/episode/:episode',
    name: 'episode-details',
    component: EpisodeDetails,
  },
  {
    path: '/movie/:filter',
    name: 'movie-filter',
    component: MovieFilter,
  },
  {
    path: '/movie/:movie',
    name: 'movie-details',
    component: MovieDetails,
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: NotFound,
  },
]
