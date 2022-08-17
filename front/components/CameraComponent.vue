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
    <canvas
      id="canvas"
      ref="canvas"
      width="500"
      height="500"
      style="visibility: hidden"
    ></canvas>
    <!-- <button @click="faceRekognitionByAws">AWSで顔認証する</button> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onBeforeMount } from '@nuxtjs/composition-api'
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

    const faceRekognitionByAws = async () => {
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

        try {
          const result = await axios.post(
            `http://localhost:8080/face-rekognition-by-aws`,
            data,
            {
              headers: {
                'content-type': 'multipart/form-data',
              },
            }
          )
          console.log(result)
          if (result.status === 200) {
            alert('顔認証に成功しました。')
          } else {
            alert(`エラーが発生しました: ${result}`)
          }
        } catch (error) {
          alert(`エラーが発生しました: ${error}`)
        }
      }
    }
    setInterval(async () => {
      await faceRekognitionByAws()
    }, 1000)

    return {
      captureStream,
      canvas,
      video,
    }
  },
})
</script>
