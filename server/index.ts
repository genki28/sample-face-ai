import express, { Request } from 'express'
import formData from 'express-form-data'
import path from 'path'
import cors from 'cors'
import fs from 'fs'

interface FileRequest extends Request {
  files: {
    file: {
      // とりあえず暫定的に
      fieldName: string
      originalFilename: string
      path: string
      headers: Object
      size: number
      name: string
      type: string
    }
  }
}

const app = express()
app.use(express.json())
app.use(express.urlencoded())

const corsOptions = {
  origin: 'http://localhost:3000',
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

const tmpDirName = '/tmp'
const uploadTmpDir = path.join(__dirname, tmpDirName)
app.use(formData.parse({ uploadDir: uploadTmpDir, autoClean: true }))
if (!fs.existsSync(uploadTmpDir)) {
  fs.mkdirSync(uploadTmpDir)
}
const uploadDirName = '/images'
const uploadDir = path.join(__dirname, uploadDirName)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

app.get('/', (req, res) => {
  console.log('sample')
  res.json('test')
})

app.post('/send-gcp', (req, res) => {
  const filePath = (req as FileRequest).files.file.path
  if (fs.existsSync(filePath)) {
    // とりあえず仮で最後の1件を保存しておく
    fs.copyFileSync(filePath, path.join(uploadDir, '/image.png'))
  }
})

app.listen(8080, () => {
  console.log(`🚀Listen: http://localhost:8080/`)
})
