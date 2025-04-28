import { NextResponse } from 'next/server'
import AWS from 'aws-sdk'

const s3 = new AWS.S3({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  useAccelerateEndpoint: true,
})

export async function POST(request: Request) {
    const { fileName, uploadId, partNumbers } = await request.json()
    const totalParts = Array.from({ length: partNumbers}, (_, i) => i + 1)

    const key = `${process.env.ENVIRONMENT}/${fileName}`
    try {
        const presignedUrls = await Promise.all(
            totalParts.map(async (partNumber) => {
                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME!,
                    Key: key,
                    UploadId: uploadId,
                    PartNumber: partNumber,
                    Expires: 3600 * 5,
                }
                return s3.getSignedUrl('uploadPart', {...params})
            })
        )
        return NextResponse.json({ presignedUrls })
    } catch (error) {
        console.error("Error starting presigned urls:", error)
        return NextResponse.json({ error: "Error starting presigned urls" }, { status: 500 })
    }
} 