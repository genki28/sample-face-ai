<!-- Please remove this file from your project -->
<template>
  <div class="">
    <video
      v-if="captureStream"
      id="video"
      ref="video"
      :srcObject.prop="captureStream"
      autoplay
      muted
    />
    <canvas id="canvas" ref="canvas" width="500" height="500"></canvas>
    <ul>
      <li class="capture" v-for="(c, key) in captures" :key="key">
        <img :src="c" height="50" alt="" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@nuxtjs/composition-api'
import { onBeforeMount } from 'vue'

export default defineComponent({
  name: 'CameraComponent',
  setup() {
    const captureStream = ref<MediaStream | undefined>()
    const canvas = ref<HTMLCanvasElement>()
    const video = ref<HTMLVideoElement>()
    const captures = ref<string[]>([])

    onBeforeMount(async () => {
      try {
        captureStream.value = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        })
      } catch (e) {
        console.error(e)
      }

      if (captureStream.value) {
        setInterval(() => {
          console.log(captureStream.value)
        }, 5000)
      }
    })

    setInterval(() => {
      if (canvas.value && video.value) {
        canvas.value.getContext('2d')?.drawImage(video.value, 0, 0, 500, 500)
        captures.value.push(canvas.value.toDataURL('image/png'))
      }
    }, 5000)

    return {
      captureStream,
      captures,
      canvas,
      video,
    }
  },
})
</script>
