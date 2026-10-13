function filenameFromDisposition(disposition) {
  if (!disposition) return '';
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try { return decodeURIComponent(encoded.replace(/["']/g, '')); } catch { return encoded; }
  }
  return disposition.match(/filename="?([^";]+)"?/i)?.[1] || '';
}

export function saveBlobDownload(response, fallbackName = 'download') {
  const blob = response?.data;
  if (!(blob instanceof Blob)) throw new Error('Download response did not contain a file.');

  const headerName = filenameFromDisposition(response.headers?.get?.('content-disposition'));
  const fileName = headerName || fallbackName || 'download';
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
