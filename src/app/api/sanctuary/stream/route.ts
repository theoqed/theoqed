import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get('id');

  if (!fileId || !/^[a-zA-Z0-9_-]{15,}$/.test(fileId)) {
    return NextResponse.json(
      { error: 'ID file Google Drive tidak valid.' },
      { status: 400 }
    );
  }

  const driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(
    fileId
  )}&export=download&confirm=t`;

  const headers: HeadersInit = {
    'User-Agent': 'Mozilla/5.0',
  };

  const range = request.headers.get('range');
  if (range) {
    headers['Range'] = range;
  }

  try {
    const driveRes = await fetch(driveUrl, {
      headers,
      redirect: 'follow',
    });

    if (!driveRes.ok && driveRes.status !== 206) {
      return NextResponse.json(
        { error: 'Gagal mengambil audio dari Google Drive.' },
        { status: driveRes.status }
      );
    }

    const contentType = driveRes.headers.get('content-type') || 'audio/mpeg';
    if (contentType.includes('text/html')) {
      return NextResponse.json(
        { error: 'File Drive masih terkunci (ubah akses ke Siapa saja yang memiliki link).' },
        { status: 403 }
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set(
      'Content-Type',
      contentType.startsWith('audio/') ? contentType : 'audio/mpeg'
    );
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    const contentLength = driveRes.headers.get('content-length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    const contentRange = driveRes.headers.get('content-range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    return new NextResponse(driveRes.body, {
      status: driveRes.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat streaming audio.' },
      { status: 500 }
    );
  }
}