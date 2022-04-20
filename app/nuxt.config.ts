import { defineNuxtConfig } from 'nuxt3'
import * as dotenv from 'dotenv';

dotenv.config();

export default defineNuxtConfig({
    nitro: {
        preset: 'aws-lambda'
    },
    app: {
        cdnURL: `${process.env.CONTENT_HOST}/demo/`,
    }
})
