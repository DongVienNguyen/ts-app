import JSZip from 'jszip';
import { startTiming, endTiming } from '@/utils/performanceMonitor';
import { BackupOptions } from './types';

export class ZipManager {
  static async createZipFile(
    backupData: { [key: string]: any },
    filename: string,
    options: BackupOptions = {}
  ): Promise<{ blob: Blob; size: number }> {
    startTiming('zip-creation');
    
    console.log('📦 Creating ZIP file...');
    
    const zip = new JSZip();
    
    for (const [path, content] of Object.entries(backupData)) {
      if (typeof content === 'string') {
        zip.file(path, content);
      } else {
        zip.file(path, JSON.stringify(content, null, 2));
      }
    }
    
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: options.compress !== false ? 'DEFLATE' : 'STORE',
      compressionOptions: { level: 6 }
    });
    
    console.log(`✅ ZIP file created: ${filename} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
    endTiming('zip-creation');
    
    return { blob, size: blob.size };
  }

  static downloadZipFile(blob: Blob, filename: string): void {
    startTiming('zip-download');
    
    console.log('💾 Initiating download...');
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Download initiated: ${filename}`);
    endTiming('zip-download');
  }

  static async extractZipFile(file: File): Promise<{ [path: string]: string }> {
    startTiming('zip-extraction');
    
    console.log('📂 Extracting ZIP file...');
    
    try {
      const zip = await JSZip.loadAsync(file);
      const contents: { [path: string]: string } = {};
      
      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          contents[path] = await zipEntry.async('text');
        }
      }
      
      console.log(`✅ ZIP file extracted: ${Object.keys(contents).length} files`);
      endTiming('zip-extraction');
      
      return contents;
    } catch (error) {
      console.error('❌ ZIP extraction failed:', error);
      endTiming('zip-extraction');
      throw error;
    }
  }

  static async getZipInfo(file: File): Promise<{
    totalFiles: number;
    totalSize: number;
    files: { path: string; size: number }[];
  }> {
    try {
      const zip = await JSZip.loadAsync(file);
      const files: { path: string; size: number }[] = [];
      let totalSize = 0;
      
      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          const content = await zipEntry.async('uint8array');
          const size = content.length;
          files.push({ path, size });
          totalSize += size;
        }
      }
      
      return {
        totalFiles: files.length,
        totalSize,
        files
      };
    } catch (error) {
      console.error('❌ Failed to get ZIP info:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        files: []
      };
    }
  }
}