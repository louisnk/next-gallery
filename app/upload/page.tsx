"use client"
import { fetchWithAuth } from "@/app/lib/auth-utils"
import { FileVideo, Music, Plus, X } from "lucide-react"
import React, { useState, useCallback, useMemo } from "react"
import { useDropzone } from "react-dropzone"

interface FileWithPreview extends File {
  preview?: string
  selected?: boolean
}

interface UploadState {
  files: FileWithPreview[]
  folders: string[]
  tags: string[]
  currentFolder: string
  currentTag: string
  uploading: boolean
}

type UploadResponse = {
  data: {
    error?: string
    imageId: string
    type: string
    url: string
  }[]
}

export default function UploadPage() {
  const [state, setState] = useState<UploadState>({
    files: [],
    folders: [],
    tags: [],
    currentFolder: "",
    currentTag: "",
    uploading: false,
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        selected: true,
      }),
    )
    setState(prev => ({ ...prev, files: [...prev.files, ...newFiles] }))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "video/*": [],
      // 'audio/*': []
    },
  })

  const addFolder = () => {
    if (state.currentFolder.trim()) {
      setState(prev => ({
        ...prev,
        folders: [...prev.folders, prev.currentFolder.trim()],
        currentFolder: "",
      }))
    }
  }

  const addTag = () => {
    if (
      state.currentTag.trim() &&
      !state.tags.includes(state.currentTag.trim())
    ) {
      setState(prev => ({
        ...prev,
        tags: [...prev.tags, prev.currentTag.trim()],
        currentTag: "",
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setState(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }))
  }

  const toggleFileSelection = (index: number) => {
    // setState(prev => ({
    //   ...prev,
    //   files: prev.files.map((file, i) =>
    //     i === index ? { ...file, selected: !file.selected } : file
    //   )
    // }))
  }

  const handleSubmit = async () => {
    setState(prev => ({ ...prev, uploading: true }))
    const folderPath = state.folders.join("/")

    try {
      // Get all selected files
      const selectedFiles = state.files.filter(file => file.selected)

      // Generate keys for all selected files
      const keys = selectedFiles.map(file =>
        folderPath ? `${folderPath}/${file.name}` : file.name,
      )

      // Get signed URLs for all files
      const urlResponse = await fetchWithAuth("/api/media", {
        method: "POST",
        body: JSON.stringify({
          keys,
          metadata: {
            tags: JSON.stringify(state.tags),
          },
        }),
      })

      const { data: signedUrls } = (await urlResponse.json()) as UploadResponse

      // Upload all files in parallel
      await Promise.all(
        selectedFiles.map(async (file, index) => {
          const urlData = signedUrls[index]
          if (!urlData || urlData.error) {
            throw new Error(`Failed to get upload URL for ${file.name}`)
          }

          // Handle different upload methods based on file type
          if (urlData.type === "image") {
            // Upload to Cloudflare Images
            const formData = new FormData()
            formData.append("file", file)

            const uploadResponse = await fetch(urlData.url, {
              method: "POST",
              body: formData,
            })

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload image ${file.name}`)
            }

            // Store image ID for later use if needed
            console.log("Uploaded image with ID:", urlData.imageId)
          } else {
            // Upload to R2 using signed URL
            const bytes = await file.arrayBuffer()
            const uploadResponse = await fetch(urlData.url, {
              method: "PUT",
              body: bytes,
              headers: {
                "Content-Type": file.type || "application/octet-stream",
              },
            })

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload file ${file.name}`)
            }
          }
        }),
      )

      // Clear form after successful upload
      setState(prev => ({
        ...prev,
        folders: [],
        tags: [],
        files: [],
        uploading: false,
      }))

      // Optionally show success message
      // toast.success('Files uploaded successfully')
    } catch (error) {
      console.error("Upload failed:", error)
      setState(prev => ({ ...prev, uploading: false }))
      // Show error message to user
      // toast.error('Upload failed: ' + error.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Folders Section */}
      <div className="space-y-4">
        {state.folders.length > 0 && (
          <div className="text-sm text-gray-600">
            Current path: {state.folders.join("/")}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={state.currentFolder}
            onChange={e =>
              setState(prev => ({ ...prev, currentFolder: e.target.value }))
            }
            className="flex-1 px-3 py-2 border rounded"
            placeholder="Add folder"
          />
          <button
            type="button"
            onClick={addFolder}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <p>Drag &apos;n&apos; drop files here, or click to select files</p>
        )}
      </div>

      {/* File Previews */}
      {state.files.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {state.files.map((file, index) => (
            <div key={file.name} className="relative">
              <input
                type="checkbox"
                checked={file.selected}
                onChange={() => toggleFileSelection(index)}
                className="absolute top-2 left-2 z-10"
              />
              {file?.type?.startsWith("image/") ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-32 object-cover rounded"
                />
              ) : file?.type?.startsWith("video/") ? (
                <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                  <FileVideo size={40} />
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                  <Music size={40} />
                </div>
              )}
              <p className="text-xs mt-1 truncate">{file.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tags Section */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={state.currentTag}
            onChange={e =>
              setState(prev => ({ ...prev, currentTag: e.target.value }))
            }
            className="flex-1 px-3 py-2 border rounded"
            placeholder="Add tag"
          />
          <button
            type="button"
            onClick={addTag}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Tag Pills */}
        <div className="flex flex-wrap gap-2">
          {state.tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-blue-600"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={state.uploading || !state.files.some(f => f.selected)}
        className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
      >
        {state.uploading ? "Uploading..." : "Upload Files"}
      </button>
    </div>
  )
}
