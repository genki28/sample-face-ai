import express from 'express'

const app = express()
app.get('/', (req, res) => {
  console.log('sample')
  res.json('test')
})

app.post('/send-gcp', (req, res) => {
  console.log(req)
})

app.listen(8080, () => {
  console.log(`🚀Listen: http://localhost:8080/`)
})
