import { useState, useCallback } from 'react';

interface FileUploadProps {
  onFileContent: (content: string, fileName: string) => void;
  fileName: string;
}

export function FileUpload({ onFileContent, fileName }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileContent(content, file.name);
      };
      reader.readAsText(file);
    },
    [onFileContent],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  return (
    <div
      className={`file-drop-zone${dragging ? ' dragging' : ''}${fileName ? ' has-file' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        accept=".txt,.md,.pdf,.docx,.csv"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <label htmlFor="file-upload" className="file-drop-label">
        {fileName ? (
          <>
            <span className="file-icon">📄</span>
            <span className="file-name">{fileName}</span>
            <span className="file-hint">Click or drop to replace</span>
          </>
        ) : (
          <>
            <span className="file-icon">📁</span>
            <span className="file-hint">Drag & drop a file or click to upload</span>
            <span className="file-types">Supports .txt, .md, .csv, .pdf, .docx</span>
          </>
        )}
      </label>
    </div>
  );
}
