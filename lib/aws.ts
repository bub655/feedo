import { 
  S3Client, 
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from 'uuid'

const CHUNK_SIZE = 1 * 1024 * 1024; // 5MB chunk size (minimum for S3 multipart)

// Validate environment variables
if (!process.env.AWS_S3_REGION) throw new Error('Missing AWS Region')
if (!process.env.AWS_S3_ACCESS_KEY_ID) throw new Error('Missing AWS Access Key ID')
if (!process.env.AWS_S3_SECRET_ACCESS_KEY) throw new Error('Missing AWS Secret Access Key')
if (!process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME) throw new Error('Missing AWS Bucket Name')
if (!process.env.NEXT_PUBLIC_AWS_CDN_URL) throw new Error('Missing AWS CDN URL')

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true // Needed for some S3 compatible storage
})

const bucketName = process.env.AWS_S3_BUCKET_NAME
const cdnUrl = process.env.NEXT_PUBLIC_AWS_CDN_URL

async function readChunk(file: File, start: number, end: number): Promise<Uint8Array> {
  const chunk = file.slice(start, end)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result))
      } else {
        reject(new Error('Failed to read chunk'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(chunk)
  })
}

export async function uploadToS3Multipart(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ key: string; url: string }> {
  try {
    const fileExtension = file.name.split('.').pop()


    const key = `${process.env.ENVIRONMENT}/${file.name.split('.')[0]}-${uuidv4()}.${fileExtension}`
    
    // Create multipart upload
    const createMultipartUpload = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: file.type,
      })
    ).catch(error => {
      console.error("Error creating multipart upload:", error)
      throw new Error("Failed to initialize upload. Please check your AWS credentials and try again.")
    })

    const uploadId = createMultipartUpload.UploadId
    if (!uploadId) {
      throw new Error("Failed to get upload ID from AWS")
    }

    const parts: { ETag: string; PartNumber: number }[] = []
    
    // Calculate total chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    let uploadedChunks = 0

    try {
      // Upload parts in sequence
      for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
        const start = (partNumber - 1) * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        
        // Read chunk as Uint8Array
        const chunkData = await readChunk(file, start, end)

        const uploadPartResponse = await s3Client.send(
          new UploadPartCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
            Body: chunkData,
            ContentLength: chunkData.length
          })
        ).catch(error => {
          console.error(`Error uploading part ${partNumber}:`, error)
          throw new Error(`Failed to upload part ${partNumber}. Please try again.`)
        })

        if (!uploadPartResponse.ETag) {
          throw new Error(`Failed to get ETag for part ${partNumber}`)
        }

        parts.push({
          ETag: uploadPartResponse.ETag,
          PartNumber: partNumber,
        })

        uploadedChunks++
        if (onProgress) {
          onProgress((uploadedChunks / totalChunks) * 100)
        }
      }

      // Complete multipart upload
      await s3Client.send(
        new CompleteMultipartUploadCommand({
          Bucket: bucketName,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: { Parts: parts },
        })
      ).catch(error => {
        console.error("Error completing multipart upload:", error)
        throw new Error("Failed to complete upload. Please try again.")
      })

      return {
        key,
        url: `${cdnUrl}${key}`
      }
    } catch (error) {
      // Abort multipart upload if something goes wrong
      try {
        await s3Client.send(
          new AbortMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: uploadId,
          })
        )
      } catch (abortError) {
        console.error("Error aborting multipart upload:", abortError)
      }
      throw error
    }
  } catch (error) {
    console.error("Error uploading to S3:", error)
    throw error instanceof Error ? error : new Error("An unexpected error occurred during upload")
  }
} 