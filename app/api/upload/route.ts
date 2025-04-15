import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from 'uuid'
import { auth } from '@clerk/nextjs/server'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileExtension = file.name.split('.').pop()
    const key = `dev/${file.name.split('.')[0]}-${uuidv4()}.${fileExtension}`

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })

    await s3Client.send(command)
    
    return NextResponse.json({ 
      success: true, 
      key,
      url: `${process.env.AWS_CDN_URL}${key}`
    })
  } catch (error) {
    console.error('Error uploading to S3:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
} 