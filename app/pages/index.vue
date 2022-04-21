<template>
  <div class="py-10">
    <header>
      <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 px-4 flex items-center justify-between flex-warp sm:flex-nowrap ">
        <h1 class="text-3xl font-bold leading-6 text-gray-900">Videos</h1>
      </div>
    </header>
    <main>
      <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div class="px-4 py-8 sm:px-0">
          <ul role="list" class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">

            <li class="relative" v-for="item in data.items">
              <div class="group block w-full aspect-w-10 aspect-h-7 rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:ring-indigo-500 overflow-hidden">
                <img :src="$contentUrl(item.thumbnail_key)" alt="" class="object-cover pointer-events-none group-hover:opacity-75">
                <button type="button" class="absolute inset-0 focus:outline-none">
                  <span class="sr-only">View details for IMG_4985.HEIC</span>
                </button>
              </div>
              <p class="mt-2 block text-sm font-medium text-gray-900 truncate pointer-events-none">{{item.title}}}</p>
              <p class="block text-sm font-medium text-gray-500 pointer-events-none">3.9 MB</p>
            </li>

          </ul>
        </div>
        <!-- /End replace -->
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import {useFetch, useNuxtApp} from "nuxt3/app";

const { data } = await useFetch('/api/videos');
const { $contentUrl } = useNuxtApp();

</script>