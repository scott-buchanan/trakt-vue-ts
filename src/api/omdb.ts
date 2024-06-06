import type { AxiosInstance, AxiosResponse } from 'axios'
import axios from 'axios'

// for public requests
const axiosInstance: AxiosInstance = axios.create()

axiosInstance.interceptors.response.use((response) => {
  return response
}, () => {
  return { data: null }
})

interface OmdbApiResponse {
  Ratings?: omdbRating[]
}
interface omdbRating {
  Source: string
  Value: string
}

export default async function getImdbRating(id: string): Promise<number | null> {
  const response: AxiosResponse = await axiosInstance.get(`http://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_API_KEY}&i=${id}`)

  if ('data' in response && 'Ratings' in (response.data as OmdbApiResponse)) {
    const responseRatings: omdbRating[] | undefined = (response.data as OmdbApiResponse).Ratings
    if (responseRatings && responseRatings.length > 0)
      return Number.parseFloat(responseRatings[0].Value.split('/')[0])
  }
  return null
}
