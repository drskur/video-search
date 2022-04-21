const HOST = process.env?.NUXT_CONTENT_HOST;
export default defineNuxtPlugin(() => {
    return {
        provide: {
            contentUrl: (key: string) => `${HOST}/${key}`
        }
    }
})