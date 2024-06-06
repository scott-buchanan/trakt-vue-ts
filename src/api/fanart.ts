import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'
import type { Fanart } from './fanart.types'

// base config for axios instances
const baseConfig: AxiosRequestConfig = {
  baseURL: 'https://webservice.fanart.tv/v3',
  params: {
    api_key: import.meta.env.VITE_FANART_API_KEY as string,
    lang: 'en',
  },
}

// for public requests
const axiosInstance: AxiosInstance = axios.create(baseConfig)

axiosInstance.interceptors.response.use((response) => {
  return response
}, () => {
  return { data: null }
})

export async function getTvFanartInfo(id: number): Promise<Fanart | null> {
  const response: AxiosResponse<Fanart> = await axiosInstance.get(`/tv/${id}`)
  if (response.data) {
    const data = { ...response.data }
    // make sure only English logos
    data.hdtvlogo = data.hdtvlogo.filter(item => item.lang === 'en')
    return data
  }
  return null
}

export async function getMovieFanartInfo(id: number): Promise<Fanart | null> {
  const response: AxiosResponse<Fanart> = await axiosInstance.get(`/movies/${id}`)
  if (response.data)
    return response.data
  return null
}

// export async function getShowClearLogo(showId: number): Promise<string | null> {
//   if (!showId)
//     return null

//   const response: AxiosResponse<Fanart> = await axiosInstance.get(`/${showId}`)

//   if (response.data) {
//     const info = response.data
//     if (info && info.hdtvlogo?.length > 0)
//       return info.hdtvlogo.filter(item => item.lang === 'en')[0]?.url

//     else if (info && info.clearlogo?.length > 0)
//       return info.clearlogo.filter(item => item.lang === 'en')[0]?.url

//     else return null
//   }
//   return null
// }

// export async function getMovieClearLogo(movieId) {
//   if (movieId) {
//     const response = await axiosInstance.get(`/${movieId}`)
//     return response.data.hdmovielogo.filter(item => item.lang === 'en')[0].url
//   }
// }

// export async function getClearLogo(id: string | number, mType: string) {
//   if (id) {
//     const response = await axiosInstance.get(`/${mType === 'show' ? 'tv' : 'movies'}/${id}&lang=en`)
//     if (mType === 'show') {
//       if (response.data?.hdtvlogo)
//         return response.data.hdtvlogo.filter(item => item.lang === 'en')[0].url

//       else if (response.data?.clearlogo)
//         return response.data.clearlogo.filter(item => item.lang === 'en')[0].url

//       else return null
//     }
//     else {
//       if (response.data?.hdtvlogo)
//         return response.data.hdtvlogo.filter(item => item.lang === 'en')[0].url

//       else return null
//     }
//   }
// }

// export async function getBanner(showId) {
//   if (showId) {
//     const response = await axiosInstance.get(`/tv/${showId}`)
//     return response.data.tvbanner[0].url
//   }
// }

// export async function getTvBackground(showId) {
//   if (showId) {
//     const response = await axiosInstance.get(`/tv/${showId}`)
//     if (response.data)
//       return response.data.tvthumb[0]?.url
//     return null
//   }
// }

// export async function getMovieBackground(showId) {
//   if (showId) {
//     const response = await axiosInstance.get(`/tv/${showId}`)
//     return response.data.tvthumb[0].url
//   }
// }
