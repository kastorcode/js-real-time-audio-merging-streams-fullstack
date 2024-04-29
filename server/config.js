import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'


// DIRECTORIES
const DIR = dirname(fileURLToPath(import.meta.url))
export const ROOT_DIR = join(DIR, '../')
export const AUDIO_DIR = join(ROOT_DIR, 'audio')
export const FX_DIR = join(AUDIO_DIR, 'fx')
export const PUBLIC_DIR = join(ROOT_DIR, 'public')
export const SONGS_DIR = join(AUDIO_DIR, 'songs')

// PAGES
export const CONTROLLER_PAGE = 'controller/index.html'
export const HOME_PAGE = 'home/index.html'
export const LOCATION = {
  HOME: '/home'
}

// PROCESS
export const PORT = process.env.PORT || 3000

// SOX
export const SOX = {
  AUDIO_MEDIA_TYPE: 'mp3',
  BITRATE_DIVISOR: 8,
  COMMANDS: {
    START: 'start',
    STOP: 'stop'
  },
  CONVERSATION: join(SONGS_DIR, 'conversation.mp3'),
  FALLBACK_BITRATE: '128000',
  FX_VOLUME: '0.1',
  SONG_VOLUME: '0.99'
}

// TYPES
export const CONTENT_TYPE = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.png': 'image/png'
}