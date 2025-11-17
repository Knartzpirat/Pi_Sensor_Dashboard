# File Upload Security

This document describes the security measures implemented for file uploads in the Pi Sensor Dashboard.

## Security Features

### 1. Cryptographically Secure Filenames ✅

**Problem:** Using `Math.random()` for filename generation is predictable and can lead to:
- Filename collision attacks
- Sequential filename guessing
- Information leakage

**Solution:** Using Node.js `crypto.randomBytes()` to generate secure random IDs:

```typescript
import { randomBytes } from 'crypto';

function generateSecureFilename(extension: string): string {
  const timestamp = Date.now();
  const randomId = randomBytes(16).toString('hex'); // 32 hex characters
  return `${timestamp}-${randomId}.${extension}`;
}
```

**Example:** `1705234567890-a3f7b2c9d4e5f6a1b2c3d4e5f6a7b8c9.jpg`

### 2. MIME Type Validation from File Content ✅

**Problem:** Trusting client-provided MIME types allows attackers to:
- Upload malicious files disguised as images/PDFs
- Bypass extension-only checks
- Execute code via polyglot files

**Solution:** Magic byte detection (file signature validation):

```typescript
function detectMimeType(buffer: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && ...) {
    return 'image/png';
  }

  // PDF: 25 50 44 46 (%PDF)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && ...) {
    return 'application/pdf';
  }

  return null;
}
```

**Supported File Types:**
- **Images:** JPEG, PNG, GIF, WebP
- **Documents:** PDF

### 3. Filename Sanitization ✅

**Problem:** Malicious filenames can contain:
- Path traversal sequences (`../`, `..\\`)
- Special characters that break file systems
- Null bytes and control characters

**Solution:** Comprehensive filename sanitization:

```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '')           // Remove parent directory references
    .replace(/[/\\]/g, '')           // Remove path separators
    .replace(/[<>:"|?*\x00-\x1f]/g, '') // Remove special chars
    .replace(/^\.+/, '')             // Remove leading dots
    .trim();
}
```

### 4. File Size Limits ✅

**Problem:** Unlimited file sizes can lead to:
- Denial of Service attacks
- Disk space exhaustion
- Memory exhaustion

**Solution:** Enforced size limits:

```typescript
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;     // 10MB
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;  // 50MB
```

### 5. Extension Whitelist ✅

**Problem:** Allowing all file extensions enables:
- Executable file uploads (.exe, .sh, .bat)
- Server-side script uploads (.php, .jsp)
- Archive bombs (.zip, .tar)

**Solution:** Strict extension whitelist:

```typescript
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const ALLOWED_DOCUMENT_EXTENSIONS = ['pdf'];
```

### 6. Authentication Required ✅

**Problem:** Unauthenticated file uploads allow:
- Anonymous storage abuse
- Spam/phishing content hosting
- Resource exhaustion

**Solution:** All uploads require authentication:

```typescript
export const POST = withAuth(async (request, user) => {
  // Only authenticated users can upload files
});
```

### 7. Comprehensive Validation Pipeline ✅

All uploaded files go through this validation pipeline:

1. **Authentication Check** - User must be logged in
2. **File Object Validation** - Verify it's a valid File object
3. **Size Validation** - Check against max size limits
4. **Filename Sanitization** - Remove dangerous characters
5. **Extension Validation** - Check against whitelist
6. **MIME Type Detection** - Verify file content matches type
7. **MIME Type Validation** - Check against allowed types

**Example:**

```typescript
const validation = validateUploadedFile(
  file,
  buffer,
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE
);

if (!validation.valid) {
  return NextResponse.json(
    { error: validation.error },
    { status: 400 }
  );
}
```

## Additional Security Recommendations

### Future Enhancements

1. **Virus Scanning Integration** 🔄
   - Integrate ClamAV or similar antivirus
   - Scan files before saving to disk
   - Quarantine suspicious files

2. **Content Security Policy (CSP)** 🔄
   - Set strict CSP headers for uploaded content
   - Prevent inline script execution
   - Serve uploads from separate domain

3. **Image Processing** 🔄
   - Re-encode images to strip metadata
   - Remove EXIF data (GPS, camera info)
   - Resize images to reduce storage

4. **Rate Limiting** 🔄
   - Limit uploads per user per hour
   - Implement file count quotas
   - Add storage quotas per user

5. **Audit Logging** 🔄
   - Log all upload attempts
   - Track failed validations
   - Monitor for suspicious patterns

## API Response Format

### Success (All Files Valid)

```json
{
  "success": true,
  "images": 2,
  "documents": 1,
  "data": {
    "images": [...],
    "documents": [...]
  }
}
```

### Success (Some Files Invalid)

```json
{
  "success": true,
  "images": 1,
  "documents": 0,
  "data": {
    "images": [...],
    "documents": []
  },
  "warnings": {
    "message": "Some files failed validation and were skipped",
    "errors": [
      {
        "file": "malicious.exe",
        "error": "File extension not allowed. Allowed: jpg, jpeg, png, gif, webp"
      },
      {
        "file": "fake.pdf",
        "error": "Unable to detect file type from content"
      }
    ]
  }
}
```

### Error (All Files Invalid)

```json
{
  "error": "All image uploads failed validation",
  "errors": [
    {
      "file": "too-large.jpg",
      "error": "File size exceeds maximum allowed size of 10MB"
    }
  ]
}
```

## Testing Security

### Manual Testing

```bash
# Test 1: Upload valid image
curl -X POST http://localhost:3000/api/uploads \
  -H "Cookie: refreshToken=..." \
  -F "entityId=uuid-here" \
  -F "entityType=TEST_OBJECT" \
  -F "images=@test.jpg"

# Test 2: Try to upload executable disguised as image
curl -X POST http://localhost:3000/api/uploads \
  -H "Cookie: refreshToken=..." \
  -F "entityId=uuid-here" \
  -F "entityType=TEST_OBJECT" \
  -F "images=@malicious.exe"
# Expected: Validation error

# Test 3: Try to upload file with path traversal
curl -X POST http://localhost:3000/api/uploads \
  -H "Cookie: refreshToken=..." \
  -F "entityId=uuid-here" \
  -F "entityType=TEST_OBJECT" \
  -F "images=@../../../etc/passwd"
# Expected: Filename sanitization prevents path traversal

# Test 4: Try to upload oversized file
curl -X POST http://localhost:3000/api/uploads \
  -H "Cookie: refreshToken=..." \
  -F "entityId=uuid-here" \
  -F "entityType=TEST_OBJECT" \
  -F "images=@huge-file.jpg"
# Expected: File size exceeds maximum error
```

## Security Checklist

- [x] Cryptographically secure filename generation
- [x] MIME type validation from file content (magic bytes)
- [x] Filename sanitization (path traversal prevention)
- [x] File size limits enforced
- [x] Extension whitelist enforced
- [x] Authentication required
- [x] Comprehensive validation pipeline
- [x] Error handling with informative messages
- [ ] Virus scanning integration
- [ ] Content Security Policy headers
- [ ] Image re-encoding and metadata stripping
- [ ] Rate limiting
- [ ] Upload audit logging

## References

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [File Signature Database](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [Node.js crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback)
