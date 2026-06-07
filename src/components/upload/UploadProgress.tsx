interface UploadProgressProps {
  isUploading: boolean;
  fileName?: string;
}

export default function UploadProgress({ isUploading, fileName }: UploadProgressProps) {
  if (!isUploading) return null;

  return (
    <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 mt-4">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
      <div>
        <p className="text-sm font-medium text-indigo-900">Uploading...</p>
        {fileName && <p className="text-xs text-indigo-600">{fileName}</p>}
      </div>
    </div>
  );
}
