import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getRequestContext } from "@cloudflare/next-on-pages"
// import type { R2Bucket, CloudflareEnv } from '@cloudflare/workers-types'
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
export const runtime = "edge"

// interface CfEnv extends CloudflareEnv {
//   R2_BUCKET: R2Bucket;
//   // any other custom bindings
// }

// type CFImagesResponse = {
//   success: boolean
//   result: {
//     uploadURL: string
//     id: string
//   }
// }

// type UploadRequest = {
//   key: string
//   file: File
//   tags: string[]
// }

// // Helper function to check if a file is an image based on extension
// function isImage(filename: string): boolean {
//   const imageExtensions = [
//     ".jpg",
//     ".jpeg",
//     ".png",
//     ".gif",
//     ".webp",
//     ".avif",
//     ".svg",
//   ]
//   const ext = filename.toLowerCase().substring(filename.lastIndexOf("."))
//   return imageExtensions.includes(ext)
// }

// // Helper function to get Cloudflare Images upload URL
// async function getCloudflareImageUploadUrl(metadata: Record<string, string>) {
//   const formData = new FormData()
//   formData.append("requireSignedURLs", "true")
//   formData.append("metadata", JSON.stringify(metadata))

//   const response = await fetch(
//     `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${process.env.CF_IMAGES_API_TOKEN}`,
//         "Content-Type": "multipart/form-data",
//       },
//       body: formData,
//     },
//   )

//   const data = await response.json() as CFImagesResponse
//   if (!data.success) {
//     console.error("Failed", data)
//     throw new Error("Failed to get Cloudflare Images upload URL")
//   }

//   return {
//     uploadUrl: data.result.uploadURL,
//     imageId: data.result.id,
//   }
// }

// // PUT route remains unchanged
// export async function PUT(request: NextRequest) {
//   const headersList = headers()
//   const token = headersList.get("Authorization")?.split(" ")[1]
//   if (!token) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   }
//   const myBucket = getRequestContext().env?.R2_BUCKET

//   const { key, file, tags } = (await request.json()) as UploadRequest

//   console.log("key", file)

//   await myBucket.put(`media/${key}`, file?.body)

//   if (tags && tags.length > 0) {
//     const filenameParts = key.split("/")
//     const filename = filenameParts.pop()
//     const path = filenameParts.join("/")
//     const baseFilename = filename.substring(0, filename.lastIndexOf("."))
//     const jsonKey = path
//       ? `tags/${path}/${baseFilename}.json`
//       : `tags/${baseFilename}.json`
//     const tagsJsonStr = JSON.stringify({ tags })
//     await myBucket.put(jsonKey, tagsJsonStr)
//   }
//   return NextResponse.json({ message: "Protected data" })
// }

// // Updated POST route to handle both images and other files
// export async function POST(request: NextRequest) {
//   const headersList = headers()
//   const token = headersList.get("Authorization")?.split(" ")[1]
//   if (!token) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   }

//   const { keys, metadata = {} } = (await request.json()) as UploadRequest
//   if (!Array.isArray(keys)) {
//     return NextResponse.json(
//       { error: "Invalid request format. Expected array of keys." },
//       { status: 400 },
//     )
//   }

//   // Setup R2 client for non-image files
//   const url = new URL(process.env?.S3_ROUTE)
//   const r2 = new S3Client({
//     region: "auto",
//     endpoint: url.toString(),
//     credentials: {
//       accessKeyId: process.env?.CF_R2_ACCESS_KEY_ID || "",
//       secretAccessKey: process.env?.CF_R2_SECRET_ACCESS_KEY || "",
//     },
//   })

//   // Process each key
//   const results = await Promise.all(
//     keys.map(async key => {
//       try {
//         // If it's an image, get Cloudflare Images upload URL
//         if (isImage(key)) {
//           const { uploadUrl, imageId } = await getCloudflareImageUploadUrl({
//             ...metadata,
//             originalKey: key,
//           })
//           return {
//             key,
//             url: uploadUrl,
//             imageId,
//             type: "image",
//           }
//         }

//         // For non-image files, get R2 signed URL
//         const signedUrl = await getSignedUrl(
//           r2,
//           new GetObjectCommand({
//             Bucket: process?.env?.CF_R2_BUCKET_NAME,
//             Key: key,
//           }),
//           { expiresIn: 3600 },
//         )
//         return {
//           key,
//           url: signedUrl,
//           type: "file",
//         }
//       } catch (error) {
//         console.error(`Error processing key ${key}:`, error)
//         return {
//           key,
//           error: "Failed to generate URL",
//           type: isImage(key) ? "image" : "file",
//         }
//       }
//     }),
//   )

//   return NextResponse.json({ data: results })
// }

// GET route remains unchanged
export async function GET(req: Request) {
  const headersList = headers()
  const token = headersList.get("Authorization")?.split(" ")[1]

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(process.env?.S3_ROUTE || "")
  const r2 = new S3Client({
    region: "auto",
    endpoint: url.toString(),
    credentials: {
      accessKeyId: process.env?.CF_R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env?.CF_R2_SECRET_ACCESS_KEY || "",
    },
  })

  const myBucket = getRequestContext()?.env?.R2_BUCKET

  const items = await myBucket.list({ prefix: "media" })
  console.log("ITEM 4: ", items.objects[4])

  const CORRUPT_FILE_URL =
    process.env.CORRUPT_FILE_URL || "/corrupt-file-placeholder.png"

  const toReturn = await Promise.all(
    items?.objects?.map(async item => {
      if (!item?.key) return false

      if (item?.size && item.size > 0) {
        try {
          const signedUrl = await getSignedUrl(
            r2,
            new GetObjectCommand({
              Bucket: process?.env?.CF_R2_BUCKET_NAME,
              Key: item.key,
            }),
            { expiresIn: 3600 },
          )
          return {
            url: signedUrl,
            key: item.key,
            size: item.size,
          }
        } catch (error) {
          console.error(
            `Error generating signed URL for key ${item.key}:`,
            error,
          )
          return {
            url: CORRUPT_FILE_URL,
            key: item.key,
            size: item.size,
            corrupted: true,
          }
        }
      }

      return {
        url: CORRUPT_FILE_URL,
        key: item.key,
        size: item.size || 0,
        corrupted: true,
      }
    }),
  )

  const filteredResults = toReturn.filter(
    v => !!v && typeof v === "object" && Object.keys(v).length !== 0,
  )
  return NextResponse.json({ data: filteredResults })
}
