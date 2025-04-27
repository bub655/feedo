import { NextResponse } from 'next/server'
import AWS from 'aws-sdk'

const s3 = new AWS.S3({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: Request) {
    console.log("Complete multipart upload route hit")
    const { filename, uploadId, parts } = await request.json()
    console.log("Parts received:", parts)
    console.log("filename:", filename)
    // Sort parts by PartNumber
    const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber)
    console.log("Sorted parts:", sortedParts)

    const key = `${process.env.ENVIRONMENT}/${filename}`

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: sortedParts.map(part => ({
                ETag: part.ETag,
                PartNumber: part.PartNumber
            }))
        }
    }

    console.log("Complete params:", params)

    try {
        const data = await s3.completeMultipartUpload(params).promise()
        return NextResponse.json({ data })
    } catch (error) {
        console.error("Error completing multipart upload:", error)
        return NextResponse.json({ 
            error: "Error completing multipart upload",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
} 