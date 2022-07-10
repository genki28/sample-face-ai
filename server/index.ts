import express, { Request } from 'express'
import formData from 'express-form-data'
import path from 'path'
import cors from 'cors'
import fs from 'fs'
import {
  CreateCollectionCommand,
  IndexFacesCommand,
  RekognitionClient,
} from '@aws-sdk/client-rekognition'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { config } from 'dotenv'
config()

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

const awsCredentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
}
const AWSRegion = process.env.AWS_REGION || ''

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

// サンプル
app.get('/', (req, res) => {
  console.log('sample')
  res.json('test')
})

// 顔認識関連
app.post('/create-collection', async (req, res) => {
  console.log(req.body.collection_name)
  console.log('region:', AWSRegion)
  // 本当は、lambdaとかでやること？？
  // Set up
  const rekognitionClient = new RekognitionClient({
    region: AWSRegion,
    credentials: awsCredentials,
  })
  const collectionName = req.body.collection_name

  try {
    const data = await rekognitionClient.send(
      new CreateCollectionCommand({ CollectionId: collectionName })
    )
    console.log(`Collection ARN: ${data.CollectionArn}`)
    console.log(`Status Code: ${data.StatusCode}`)
    console.log(`Success: `, data)

    res.send(`Success`).status(200)
  } catch (e) {
    res.send(`Failed: ${e}`).status(500)
  }
})

app.post('/add-face-to-collection', async (req, res) => {
  const filePath = (req as FileRequest).files.file.path
  const name = (req as FileRequest).files.file.name
  const blob = fs.readFileSync(filePath)
  const data = await sendImageToS3(name, blob)
  console.log(data)

  const rekognitionClient = new RekognitionClient({
    region: AWSRegion,
    credentials: awsCredentials,
  })
  rekognitionClient.send(new IndexFacesCommand())
})

const sendImageToS3 = async (fileName: string, blob: Buffer) => {
  const s3Client = new S3Client({
    region: AWSRegion,
    credentials: awsCredentials,
  })

  try {
    const data = await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET || '',
        Key: fileName,
        Body: blob,
      })
    )
    return data
  } catch (e) {
    throw new Error(JSON.stringify(e))
  }
}

app.post('/face-rekognition-by-aws', (req, res) => {
  const filePath = (req as FileRequest).files.file.path
  if (fs.existsSync(filePath)) {
    // とりあえず仮で最後の1件を保存しておく
    fs.copyFileSync(filePath, path.join(uploadDir, '/image.png'))
  }
})

app.listen(8080, () => {
  console.log(`🚀Listen: http://localhost:8080/`)
})
