
import { NextRequest, NextResponse } from 'next/server';
import { parseAcpnText } from '@/lib/acpnParser';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call pdf-parse safely
    const pdfParse = require('pdf-parse');
    const parser = new pdfParse.PDFParse({ data: buffer });
    const pdfRes = await parser.getText();

    const claims = parseAcpnText(pdfRes.text);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      totalClaims: claims.length,
      claims
    });
  } catch (err: any) {
    console.error('API Parse PDF error:', err);
    return NextResponse.json({ error: err.message || 'Failed to parse PDF' }, { status: 500 });
  }
}
