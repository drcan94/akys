"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  File,
  FileImage,
  FilePdf,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
};

interface FileUploadProps {
  noteId: string | null;
  onNext?: () => void;
  onBack?: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  progress: number;
}

export function FileUpload({ noteId, onNext, onBack }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const { data: existingFiles } = api.operationNote.getById.useQuery(
    { id: noteId! },
    { enabled: !!noteId }
  );

  const { mutate: uploadFile } = api.operationNote.uploadFile.useMutation({
    onSuccess: (data) => {
      setFiles((prev) =>
        prev.map((file) =>
          file.name === data.fileName
            ? {
                id: data.id,
                name: data.fileName,
                size: data.fileSize,
                type: data.fileType,
                url: data.fileUrl,
                progress: 100,
              }
            : file
        )
      );
      setIsUploading(false);
      toast({
        title: "Başarılı",
        description: "Dosya yüklendi.",
      });
    },
    onError: (error) => {
      setIsUploading(false);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
  });

  const { mutate: deleteFile } = api.operationNote.deleteFile.useMutation({
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Dosya silindi.",
      });
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!noteId) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Önce operasyon notunu kaydetmelisiniz.",
        });
        return;
      }

      setIsUploading(true);

      for (const file of acceptedFiles) {
        if (file.size > MAX_FILE_SIZE) {
          toast({
            variant: "destructive",
            title: "Hata",
            description: "Dosya boyutu 5MB'dan büyük olamaz.",
          });
          continue;
        }

        // Add file to state with 0 progress
        setFiles((prev) => [
          ...prev,
          {
            id: "",
            name: file.name,
            size: file.size,
            type: file.type,
            url: "",
            progress: 0,
          },
        ]);

        // Convert file to buffer
        const buffer = await file.arrayBuffer();

        // Upload file
        uploadFile({
          noteId,
          file: {
            name: file.name,
            type: file.type as keyof typeof ACCEPTED_FILE_TYPES,
            size: file.size,
          },
          buffer: Buffer.from(buffer),
        });
      }
    },
    [noteId, toast, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const handleDelete = (fileId: string) => {
    deleteFile({ fileId });
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return FileImage;
    if (type === "application/pdf") return FilePdf;
    return FileText;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dosya Yükleme</CardTitle>
          <CardDescription>
            Operasyon notu ile ilgili dosyaları yükleyin (maksimum 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Dosyaları sürükleyip bırakın veya tıklayarak seçin
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG veya PDF (maksimum 5MB)
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id || file.name}
                  className="flex items-center gap-4 rounded-lg border p-4"
                >
                  {React.createElement(getFileIcon(file.type), {
                    className: "h-8 w-8 flex-shrink-0",
                  })}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {file.progress < 100 && (
                      <Progress value={file.progress} className="h-1" />
                    )}
                  </div>
                  {file.progress === 100 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isUploading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Dosyalar yükleniyor...</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Geri
          </Button>
        )}
        {onNext && (
          <Button onClick={onNext} disabled={isUploading}>
            İleri
          </Button>
        )}
      </div>
    </div>
  );
}
