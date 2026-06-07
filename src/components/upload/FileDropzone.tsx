import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileDropzoneProps {
  accept: Record<string, string[]>;
  onFile: (file: File) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export default function FileDropzone({
  accept,
  onFile,
  label,
  hint,
  disabled = false,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFile(acceptedFiles[0]);
      }
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-indigo-400 bg-indigo-50'
          : disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
          : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      <svg
        className="h-10 w-10 text-gray-400 mx-auto mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {isDragActive && (
        <p className="text-sm text-indigo-600 font-medium mt-2">Drop the file here</p>
      )}
    </div>
  );
}
