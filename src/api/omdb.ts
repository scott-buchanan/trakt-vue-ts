import type { AxiosInstance } from 'axios'
import axios from 'axios'

interface Ratings {
  ratings: {
    [key: string]: {
      timestamp: Date
      rating: number
    }
  }
}

// for public requests
const axiosInstance: AxiosInstance = axios.create()

axiosInstance.interceptors.response.use((response) => {
  return response
}, () => {
  return { data: null }
})

export default async function getImdbRating(id: string): Promise<number | null> {
  const storedRatings: Ratings = JSON.parse(localStorage.getItem('imdbRatings') || '{}') as Ratings

  if (storedRatings[id]) {
    // console.log('return from cache: ', storedRatings[id])
    return storedRatings[id].rating
  }

  const response = await axiosInstance.get(`http://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_API_KEY}&i=${id}`)

  const responseRatings = response?.data?.Ratings
  let rating: number | null = null

  if (responseRatings && responseRatings.length > 0) {
    rating = response.data.Ratings[0].Value.split('/')[0]
    // console.log('return not from cache', response.data.Ratings[0].Value.split('/')[0])
    const merged = { ...storedRatings, [id]: { timestamp: new Date().toISOString(), rating } }
    localStorage.setItem('imdbRatings', JSON.stringify(merged))
    return rating
  }
  // localStorage.setItem('imdb_ratings', JSON.stringify({ ...ratings, ...{ [response.data.imdbID]: response.data.Ratings[0].Value.split('/')[0] } }))

  return null
}

// response.data
// {
//   "Title": "Clarkson's Farm",
//   "Year": "2021–",
//   "Rated": "TV-PG",
//   "Released": "10 Jun 2021",
//   "Runtime": "2 min",
//   "Genre": "Documentary, Comedy, Reality-TV",
//   "Director": "N/A",
//   "Writer": "N/A",
//   "Actors": "Jeremy Clarkson, Kaleb Cooper, Charlie Ireland",
//   "Plot": "Follow Jeremy Clarkson as he attempts to run a farm in the countryside.",
//   "Language": "English",
//   "Country": "United Kingdom",
//   "Awards": "1 nomination",
//   "Poster": "https://m.media-amazon.com/images/M/MV5BYWI5M2YyYmYtMzBkNy00YWYyLThjZGUtYzEyOTQxZDQyYmVhXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_SX300.jpg",
//   "Ratings": [
//       {
//           "Source": "Internet Movie Database",
//           "Value": "9.0/10"
//       }
//   ],
//   "Metascore": "N/A",
//   "imdbRating": "9.0",
//   "imdbVotes": "55,513",
//   "imdbID": "tt10541088",
//   "Type": "series",
//   "totalSeasons": "3",
//   "Response": "True"
// }
