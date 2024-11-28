export const runtime = "edge"

import jwt from "@tsndr/cloudflare-worker-jwt"
import { NextResponse } from "next/server"

const SECRET_KEY = process.env.JWT_SECRET || "fallback-secret-key"

type LoginProps = {
  username: string
  password: string
}

export async function POST(req: Request) {
  try {
    const { username, password } = (await req.json()) as LoginProps

    const { SECRET_PASSWORD } = process.env

    // Check if password matches environment variable
    if (password !== SECRET_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      )
    }

    // Create JWT token
    const token = await jwt.sign(
      {
        username,
        exp: Math.floor(Date.now() / 1000) + 168 * (60 * 60),
      },
      SECRET_KEY,
    )

    return NextResponse.json({ token })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
