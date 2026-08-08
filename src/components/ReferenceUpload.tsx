import { useRef, useState } from 'react';

interface Props {
  onFile: (file: File) => void;
  previewUrl?: string | null;
  hint?: string;
}

export function ReferenceUpload({
  onFile,
  previewUrl,
  hint = 'Drop a real-world photo to pixelize into a location',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    onFile(file);
  }

  return (
    <div
      className={`ref-upload ${dragging ? 'ref-upload--dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      {previewUrl ? (
        <img src={previewUrl} alt="Reference" className="ref-upload__preview" />
      ) : (
        <div className="ref-upload__empty">
          <strong>Reference photo</strong>
          <p>{hint}</p>
        </div>
      )}
    </div>
  );
}
