# TV and Movie management app
## Trakt client built with Vue 3 + TypeScript and fed by Trakt, TMDB, OMDb and fanart.tv API's

Personal project using Vue 3 to get more familiar with TypeScript and Tailwind CSS. Using Trakt, TMDB, fanart, OMDb REST API's.

> [!NOTE]
> This project is currently undergoing a rewrite from the ground up. I am removing SCSS and replacing it with Tailwind CSS. Also major refactoring because my JavaScript knowledge has grown since I started this project in 2022

Features:
- View TV lists. Filters include: Trending (Trakt), Watched history (list of episodes), Anticipated, My recommended shows, Community recommended.
- View TV Show seasons, list episodes per season with details, watched status, ability to rate, set watched etc.
- View movie lists. Filters include: Trending (Trakt), Watched history, My recommended movies.
- Search for TV Shows and Movies (with autocomplete). This includes autocomplete dropdown as well as a search page with results if you hit enter to search.
- Rate episodes, shows, movies (Trakt)
- Read Reviews (and replies) for episodes, shows, movies
- View list of actors for episodes, shows, movies
- View watched progress of TV shows (overall and per season)
- Mobile support (this will be ongoing as things change)

## Upcoming features
- Write reviews
- Rate episode/show/movie will also push to TMDB (big maybe on this one)
- Actors section (instead of linking off to IMDb)

More will be added to this list as I think of things to add.

## Project setup
```
pnpm i
pnpm run dev
```
![app](https://github.com/scott-buchanan/trakt-vue-ts/assets/7110108/01e8ccb9-dd9b-486e-9308-e2ae212677bc)
![app](https://github.com/scott-buchanan/trakt-vue-ts/assets/7110108/216ce4c7-224f-4f36-be22-0fd61ef18bcf)
