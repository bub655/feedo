// This is a storage service abstraction that can be easily switched between local and S3 storage
export interface StorageService {
  uploadFile(file: File): Promise<{ url: string; filename: string }>;
}

// Local storage implementation
export class LocalStorageService implements StorageService {
  async uploadFile(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Upload failed")
    }

    return response.json()
  }
}

// Export the current storage service implementation
export const storageService: StorageService = new LocalStorageService() 