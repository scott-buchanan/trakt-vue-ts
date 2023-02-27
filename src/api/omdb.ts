import axios from 'axios'

export default async function getImdbRating(id: string) {
  try {
    const response = await axios({
      method: 'GET',
      url: `http://www.omdbapi.com/?apikey=8b1738a&i=${id}`,
    })
    return response.data.Ratings[0].Value.split('/')[0]
  }
  catch (error) {
    return null
  }
}
