import axios from 'axios'

export async function getShowClearLogo(showId) {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://webservice.fanart.tv/v3/tv/${showId}?api_key=6c7b80e914b8b4a7f630895236272ee0`,
    })
    return response.data.hdtvlogo
      ? response.data.hdtvlogo.filter(item => item.lang === 'en')[0].url
      : response.data.clearlogo.filter(item => item.lang === 'en')[0].url
  }
  catch (error) {
    return null
  }
}

export async function getMovieClearLogo(movieId) {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://webservice.fanart.tv/v3/movies/${movieId}?api_key=6c7b80e914b8b4a7f630895236272ee0&lang=en`,
    })
    return response.data.hdmovielogo.filter(item => item.lang === 'en')[0].url
  }
  catch (error) {
    return null
  }
}

export async function getClearLogo(id: string | number, mType: string) {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://webservice.fanart.tv/v3/${mType === 'show' ? 'tv' : 'movies'}/${id}?api_key=6c7b80e914b8b4a7f630895236272ee0&lang=en`,
    })
    if (mType === 'show') {
      return response.data.hdtvlogo
        ? response.data.hdtvlogo.filter(item => item.lang === 'en')[0].url
        : response.data.clearlogo.filter(item => item.lang === 'en')[0].url
    }
    else {
      return response.data.hdmovielogo.filter(item => item.lang === 'en')[0].url
    }
  }
  catch (error) {
    return null
  }
}

export async function getBanner(showId) {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://webservice.fanart.tv/v3/tv/${showId}?api_key=6c7b80e914b8b4a7f630895236272ee0`,
    })
    return response.data.tvbanner[0].url
  }
  catch (error) {
    return null
  }
}

export async function getTvBackground(showId) {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://webservice.fanart.tv/v3/tv/${showId}?api_key=6c7b80e914b8b4a7f630895236272ee0`,
    })
    if (response.data.tvthumb.length < 1)
      return response.data.tvthumb[0].url

    return response.data.tvthumb[0].url
  }
  catch (error) {
    return null
  }
}

export async function getMovieBackground(showId) {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://webservice.fanart.tv/v3/tv/${showId}?api_key=6c7b80e914b8b4a7f630895236272ee0`,
    })
    return response.data.tvthumb[0].url
  }
  catch (error) {
    return null
  }
}
