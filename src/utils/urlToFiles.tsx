export async function urlToFile(url: string, nameHint?: string): Promise<File> {
  const res = await fetch(url); // works for http(s), blob:, and data:
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const blob = await res.blob();

  const filenameFromHeaders = () => {
    const cd = res.headers.get('content-disposition');
    const m = cd && /filename\*?=(?:UTF-8'')?("?)([^";]+)\1/i.exec(cd);
    return m ? decodeURIComponent(m[2]) : '';
  };

  const filenameFromURL = () => {
    try {
      const u = new URL(url, location.href);
      const base = (u.pathname.split('/').pop() || '').split('?')[0];
      return base || '';
    } catch { return ''; }
  };

  const extFromType = () => (blob.type?.split('/')[1] || 'bin');

  const name =
    nameHint ||
    filenameFromHeaders() ||
    filenameFromURL() ||
    `file_${Date.now()}.${extFromType()}`;

  return new File([blob], name, {
    type: blob.type || 'application/octet-stream',
    lastModified: Date.now(),
  });
}
