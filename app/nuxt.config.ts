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
        cdnURL: `${process.env.CONTENT_HOST}/demo/`,
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
