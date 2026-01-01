"use client";

import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { createClient } from "@/lib/supabase/client";
import { CloudUpload, X } from "lucide-react";
import { nanoid } from "nanoid";
import * as React from "react";
import { toast } from "sonner";

const supabase = createClient();

export interface SignedUrlData {
  file: File;
  signedUrl: string;
  name: string;
}

interface FileUploadFormProps {
  value: File | null;
  onChange: (file: File | null) => void;
  onSignedUrlChange?: (data: SignedUrlData | null) => void;
  maxSize?: number;
  bucket?: string;
}

export default function FileUploadForm({
  value,
  onChange,
  onSignedUrlChange,
  maxSize = 20 * 1024 * 1024,
  bucket = "resumes",
}: FileUploadFormProps) {
  const [file, setFile] = React.useState<File | null>(value);

  const generateSignedUrl = async (file: File) => {
    try {
      const fileNameUnique = `${file.name}-${nanoid()}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(fileNameUnique);

      if (!data || error) throw error || new Error("Cannot get signed URL");
      onSignedUrlChange?.({
        file,
        signedUrl: data.signedUrl,
        name: fileNameUnique,
      });
    } catch (err) {
      console.error("Error generating signed URL", err);
      toast("Lấy signed URL lỗi");
    }
  };

  const handleChange = (files: File[]) => {
    const selected = files[0] || null;
    setFile(selected);
    onChange?.(selected);
    if (selected) generateSignedUrl(selected);
    else onSignedUrlChange?.(null);
  };

  return (
    <FileUpload
      value={file ? [file] : []}
      onValueChange={handleChange}
      accept="application/pdf,image/*"
      maxFiles={1}
      maxSize={maxSize}
    >
      <FileUploadDropzone className="flex-row flex-wrap border-dotted text-center">
        <CloudUpload className="size-4" />
        Drag and drop or
        <FileUploadTrigger asChild>
          <Button variant="link" size="sm" className="p-0">
            choose file
          </Button>
        </FileUploadTrigger>{" "}
        <span className="text-red-500 font-semibold">1 file</span> to upload
      </FileUploadDropzone>
      <FileUploadList>
        {file && (
          <FileUploadItem value={file}>
            <FileUploadItemPreview />
            <FileUploadItemMetadata />
            <FileUploadItemDelete asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <X />
                <span className="sr-only">Delete</span>
              </Button>
            </FileUploadItemDelete>
          </FileUploadItem>
        )}
      </FileUploadList>
    </FileUpload>
  );
}
