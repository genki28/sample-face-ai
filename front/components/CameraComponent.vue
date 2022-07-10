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
      width="500"
      height="500"
    />
    <canvas id="canvas" ref="canvas" width="500" height="500"></canvas>
    <button @click="faceRekognitionByAws">AWSで顔認証する</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@nuxtjs/composition-api'
import { onBeforeMount } from 'vue'
import axios from 'axios'

export default defineComponent({
  name: 'CameraComponent',
  setup() {
    const captureStream = ref<MediaStream | undefined>()
    const canvas = ref<HTMLCanvasElement>()
    const video = ref<HTMLVideoElement>()

    onBeforeMount(async () => {
      try {
        captureStream.value = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        })
      } catch (e) {
        console.error(e)
      }
    })

    // setInterval(() => {
    //   if (canvas.value && video.value) {
    //     canvas.value.getContext('2d')?.drawImage(video.value, 0, 0, 500, 500)
    //   }
    // }, 5000)
    const faceRekognitionByAws = () => {
      if (canvas.value && video.value) {
        // blob化
        canvas.value.getContext('2d')?.drawImage(video.value, 0, 0, 500, 500)
        const url = canvas.value.toDataURL('image/png')
        const bin = window.atob(url.split(',')[1])
        const buffer = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) {
          buffer[i] = bin.charCodeAt(i)
        }
        const blob = new Blob([buffer.buffer], { type: 'image/png' })

        // データ送信
        const data = new FormData()
        data.append('file', blob)

        axios.post('http://localhost:8080/face-rekognition-by-aws', data, {
          headers: {
            'content-type': 'multipart/form-data',
          },
        })
      }
    }

    return {
      captureStream,
      canvas,
      video,
      faceRekognitionByAws,
    }
  },
})
</script>
