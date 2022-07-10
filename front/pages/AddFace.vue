<template>
  <div>
    <h1>顔写真をupload</h1>
    <label>
      顔写真
      <input type="file" @change="selectFile" />
    </label>
    <label>
      CollectionName
      <input v-model="collectionName" type="text" />
    </label>
    <button @click="sendImage">顔写真を登録する</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@nuxtjs/composition-api'
import axios from 'axios'

export default defineComponent({
  name: 'AddFace',
  setup() {
    const file = ref<File>()
    const collectionName = ref<string>('')

    const sendImage = () => {
      const data = new FormData()
      data.append('file', file.value)
      data.append('collection_name', collectionName.value)
      axios.post('http://localhost:8080/add-face-to-collection', data, {
        headers: {
          'content-type': 'multipart/form-data',
        },
      })
    }

    const selectFile = (event: { target: HTMLInputElement }) => {
      file.value = event.target.files[0]
    }

    return {
      collectionName,
      sendImage,
      selectFile,
    }
  },
})
</script>
