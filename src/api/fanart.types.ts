interface ImageInfo {
  id: string
  url: string
  lang: string
  likes: string
  season?: string
}

export interface Fanart {
  name: string
  thetvdb_id: string
  hdtvlogo: ImageInfo[]
  hdmovielogo: ImageInfo[]
  clearlogo: ImageInfo[]
  showbackground: ImageInfo[]
  tvthumb: ImageInfo[]
  tvbanner: ImageInfo[]
  tvposter: ImageInfo[]
  seasonposter: ImageInfo[]
}
