import express from 'express'
import formData from 'express-form-data'
import path from 'path'

const app = express()
app.use(express.json())
app.use(express.urlencoded())

const uploadDir = path.join(__dirname, '/tmp')
app.use(formData.parse({ uploadDir, autoClean: true }))

app.get('/', (req, res) => {
  console.log('sample')
  res.json('test')
})

app.post('/send-gcp', (req, res) => {
  console.log(req.body)
})

app.listen(8080, () => {
  console.log(`🚀Listen: http://localhost:8080/`)
})
