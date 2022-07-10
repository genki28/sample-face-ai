import express, { Request } from 'express'
import formData from 'express-form-data'
import path from 'path'
import cors from 'cors'
import fs from 'fs'
import {
  CreateCollectionCommand,
  IndexFacesCommand,
  ListCollectionsCommand,
  ListFacesCommand,
  RekognitionClient,
  SearchFacesByImageCommand,
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
  const collectionName = req.body.collection_name
  const filePath = (req as FileRequest).files.file.path
  const fileName = (req as FileRequest).files.file.name
  const blob = fs.readFileSync(filePath)
  const data = await sendImageToS3(fileName, blob)

  const rekognitionClient = new RekognitionClient({
    region: AWSRegion,
    credentials: awsCredentials,
  })
  try {
    const collectionData = await rekognitionClient.send(
      new IndexFacesCommand({
        Image: {
          S3Object: {
            Bucket: process.env.AWS_BUCKET || '',
            Name: fileName,
            Version: data.VersionId,
          },
        },
        CollectionId: collectionName,
      })
    )
    console.log(collectionData)
    res.send('Success').status(200)
  } catch (e) {
    res.send(`Failed: ${e}`).status(500)
  }
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

app.post('/face-rekognition-by-aws', async (req, res) => {
  const filePath = (req as FileRequest).files.file.path
  if (fs.existsSync(filePath)) {
    // とりあえず仮で最後の1件を保存しておく
    fs.copyFileSync(filePath, path.join(uploadDir, '/image.png'))
  }

  const rekognitionClient = new RekognitionClient({
    region: AWSRegion,
    credentials: awsCredentials,
  })
  const response = await rekognitionClient.send(
    new SearchFacesByImageCommand({
      CollectionId: 'sample-rekognition',
      Image: {
        Bytes: fs.readFileSync(filePath),
      },
    })
  )
  console.log(`Response: ${JSON.stringify(response)}`)
  res.send('Success').status(200)
})

app.get('/face-collection-index', async (req, res) => {
  const rekognitionClient = new RekognitionClient({
    region: AWSRegion,
    credentials: awsCredentials,
  })

  const response = await rekognitionClient.send(
    new ListCollectionsCommand({ MaxResults: 3 })
  )
  console.log(response)

  res.json(response).status(200)
})

app.get('/face-collection-image-index', async (req, res) => {
  const rekognitionClient = new RekognitionClient({
    region: AWSRegion,
    credentials: awsCredentials,
  })

  const response = await rekognitionClient.send(
    new ListFacesCommand({
      CollectionId: 'sample-rekognition',
    })
  )
  console.log(response)
  res.json(response).status(200)
})

app.listen(8080, () => {
  console.log(`🚀Listen: http://localhost:8080/`)
})
