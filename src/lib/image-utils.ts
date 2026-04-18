import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file natively in the browser to optimize for Supabase Free Tier storage.
 * It strictly converts to WebP format, reduces the maximum dimension, and limits file size.
 *
 * @param file - The original File object (usually from an <input type="file">)
 * @returns A Promise that resolves to the compressed File object.
 */
export async function compressImageForStorage(file: File): Promise<File> {
  const options = {
    // Max file size in MB. 0.3 means 300KB
    maxSizeMB: 0.3,
    // Max width/height. 1920 is Full HD, good enough for most web portfolios.
    maxWidthOrHeight: 1920,
    // Always convert to WebP for best size-to-quality ratio
    useWebWorker: true,
    fileType: 'image/webp' as const,
    // Provide a small initial quality drop, library will figure out best compression
    initialQuality: 0.8,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    
    // browser-image-compression returns a Blob, we need to cast it back to a File 
    // to keep compatibility with standard upload logic. 
    // We update the extension to .webp
    const originalName = file.name.split('.')[0];
    const compressedFile = new File([compressedBlob], `${originalName}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    console.log(`[Image Optimizer] Original: ${(file.size / 1024 / 1024).toFixed(2)} MB -> Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    
    return compressedFile;

  } catch (error) {
    console.error("Error compressing image:", error);
    // Fallback to original file if compression fails for some reason
    return file;
  }
}
