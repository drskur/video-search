import { defineNuxtConfig } from 'nuxt3'
import * as dotenv from 'dotenv';
import aspectRatio from '@tailwindcss/aspect-ratio';

dotenv.config();

export default defineNuxtConfig({
    modules: [
        '@nuxtjs/tailwindcss'
    ],
    nitro: {
        preset: 'aws-lambda'
    },
    app: {
        cdnURL: `${process.env.NUXT_CONTENT_HOST}/demo/`,
    },
    env: {
        NUXT_CONTENT_HOST: 'https://d22ghy1m0u38xp.cloudfront.net',
        NUXT_DYNAMODB_TABLE_NAME: 'video-search-video'
    },
    tailwindcss: {
        viewer: false,
        config: {
            plugins: [aspectRatio]
        }
    },
    build: {
        transpile: ['@heroicons/vue']
    }
})
