import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route to convert Firebase Storage URL to base64
 * This runs on the server side where CORS is not an issue
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Invalid imageUrl provided' },
        { status: 400 }
      );
    }

    // Fetch the image from Firebase Storage (server-side, no CORS issues)
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Convert to buffer then to base64
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    return NextResponse.json({ imageBase64: base64 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to convert image to base64' },
      { status: 500 }
    );
  }
}
