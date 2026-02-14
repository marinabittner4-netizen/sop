import { PDFDocument } from 'pdf-lib';

// Vercel Node Serverless Function
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    // Read raw body (Vercel may not parse JSON automatically for plain Node functions)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    const data = raw ? JSON.parse(raw) : {};

    const pdfBase64 = data.pdfBase64;
    const filename = data.filename || 'Bestellung_final.pdf';
    if (!pdfBase64) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing pdfBase64' }));
      return;
    }

    const pdfBytes = Buffer.from(pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Try to lock fields + flatten (if the PDF has forms)
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      for (const f of fields) {
        try { f.enableReadOnly(); } catch (_) {}
      }
      try { form.flatten(); } catch (_) {}
    } catch (_) {
      // No form present – nothing to flatten
    }

    const outBytes = await pdfDoc.save();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(Buffer.from(outBytes));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server error', details: String(err?.message || err) }));
  }
}
