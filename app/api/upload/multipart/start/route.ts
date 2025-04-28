import { NextResponse } from 'next/server'
import AWS from 'aws-sdk'

let s3: AWS.S3
try {
  s3 = new AWS.S3({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    useAccelerateEndpoint: true,
  })
} catch (error) {
  console.error("Error initializing S3 client:", error)
}

export async function POST(request: Request) {
  console.log("API route hit")
  try {
    if (!s3) {
      throw new Error("S3 client not initialized")
    }

    console.log("Starting multipart upload")
    const { filename, contentType } = await request.json()
    console.log("File name: ", filename)
    console.log("Content type: ", contentType)

    const key = `${process.env.ENVIRONMENT}/${filename}`
    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error("AWS_S3_BUCKET_NAME is not set")
    }

    const params: any = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    }

    // add extra params if content type is video
    if (contentType === "VIDEO") {
      params.ContentDisposition = "inline"
      params.ContentType = "video/mp4"
    }

    const multipart = await s3.createMultipartUpload(params).promise()
    return NextResponse.json({ uploadId: multipart.UploadId })
  } catch (error) {
    console.error("Error starting multipart upload:", error)
    // Return the actual error message
    return NextResponse.json({ 
      error: "Error starting multipart upload",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 