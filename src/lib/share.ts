/**
 * Cross-platform share utility that works on Web and Capacitor (Android/iOS)
 * Handles image sharing with proper permissions and native share sheet
 */

// Check if we're in a Capacitor native environment
const isCapacitor = (): boolean => {
  return typeof window !== 'undefined' && 
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         !!(window as any).Capacitor?.isNativePlatform?.();
};

/**
 * Share or download an image from a canvas
 * On web: Downloads the file
 * On Capacitor: Uses native share sheet
 */
export async function shareImage(
  canvas: HTMLCanvasElement, 
  filename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isCapacitor()) {
      // Use Capacitor native share
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      
      // Convert canvas to base64
      const base64Data = canvas.toDataURL('image/png').split(',')[1];
      
      // Save to cache directory (no permissions needed)
      const fileName = `${filename}.png`;
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      
      // Share the file using native share sheet
      await Share.share({
        title: filename,
        url: result.uri,
        dialogTitle: 'Share your image',
      });
      
      return { success: true };
    } else {
      // Web fallback - try Web Share API first, then download
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
      
      // Try Web Share API if available and supports files
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `${filename}.png`, { type: 'image/png' });
        const shareData = { files: [file], title: filename };
        
        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            return { success: true };
          } catch (e) {
            // User cancelled or share failed, fall through to download
            if ((e as Error).name === 'AbortError') {
              return { success: false, error: 'Share cancelled' };
            }
          }
        }
      }
      
      // Fallback to download
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      return { success: true };
    }
  } catch (error) {
    console.error('Share failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Download an image directly (for "Save" button)
 * On web: Downloads the file
 * On Capacitor: Saves to Downloads folder
 */
export async function downloadImage(
  canvas: HTMLCanvasElement, 
  filename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isCapacitor()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      // Convert canvas to base64
      const base64Data = canvas.toDataURL('image/png').split(',')[1];
      
      // Save to Documents directory (accessible by user)
      const fileName = `${filename}.png`;
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
      });
      
      return { success: true };
    } else {
      // Web download
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      return { success: true };
    }
  } catch (error) {
    console.error('Download failed:', error);
    return { success: false, error: (error as Error).message };
  }
}
