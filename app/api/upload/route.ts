import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create videos directory if it doesn't exist
    const videosDir = join(process.cwd(), "public", "videos")
    try {
      await mkdir(videosDir, { recursive: true })
    } catch (error) {
      console.error("Error creating videos directory:", error)
      return NextResponse.json(
        { error: "Error creating videos directory" },
        { status: 500 }
      )
    }

    // Create unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    const path = join(videosDir, filename)

    // Save file
    await writeFile(path, buffer)

    // Return the public URL
    return NextResponse.json({ 
      success: true,
      url: `/videos/${filename}`,
      filename
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    )
  }
} 