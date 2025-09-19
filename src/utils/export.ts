import JSZip from 'jszip';
import { GeneratedCode } from '../types';

export class CodeExporter {
  static async exportAsZip(code: GeneratedCode, projectName: string = 'bolt-project'): Promise<void> {
    const zip = new JSZip();
    
    // Add HTML file
    if (code.html) {
      zip.file('index.html', this.createHTMLFile(code));
    }
    
    // Add CSS file
    if (code.css) {
      zip.file('styles.css', code.css);
    }
    
    // Add JavaScript file
    if (code.js) {
      zip.file('script.js', code.js);
    }
    
    // Add README
    zip.file('README.md', this.createReadme(projectName));
    
    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    this.downloadFile(blob, `${projectName}.zip`);
  }

  static exportAsHTML(code: GeneratedCode, filename: string = 'index.html'): void {
    const htmlContent = this.createHTMLFile(code);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    this.downloadFile(blob, filename);
  }

  static exportAsCSS(code: GeneratedCode, filename: string = 'styles.css'): void {
    if (!code.css) return;
    const blob = new Blob([code.css], { type: 'text/css' });
    this.downloadFile(blob, filename);
  }

  static exportAsJS(code: GeneratedCode, filename: string = 'script.js'): void {
    if (!code.js) return;
    const blob = new Blob([code.js], { type: 'text/javascript' });
    this.downloadFile(blob, filename);
  }

  static exportAllFiles(code: GeneratedCode, projectName: string = 'bolt-project'): void {
    this.exportAsHTML(code, `${projectName}.html`);
    if (code.css) this.exportAsCSS(code, `${projectName}.css`);
    if (code.js) this.exportAsJS(code, `${projectName}.js`);
  }

  private static createHTMLFile(code: GeneratedCode): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Project</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    ${code.html || '<!-- No HTML content -->'}
    <script src="script.js"></script>
</body>
</html>`;
  }

  private static createReadme(projectName: string): string {
    return `# ${projectName}

This project was generated using Bolt Clone - AI Code Generator.

## Files

- \`index.html\` - Main HTML file
- \`styles.css\` - CSS styles
- \`script.js\` - JavaScript functionality

## How to run

1. Open \`index.html\` in your web browser
2. Or serve the files using a local web server

## Generated with Bolt Clone

Visit [Bolt Clone](https://github.com/your-repo/bolt-clone) to generate more projects!
`;
  }

  private static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      return new Promise((resolve, reject) => {
        try {
          document.execCommand('copy');
          textArea.remove();
          resolve();
        } catch (err) {
          textArea.remove();
          reject(err);
        }
      });
    }
  }
}
