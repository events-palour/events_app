import React from 'react';
import Image from 'next/image';
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { validateFile, fileToBase64 } from "@/lib/server/organization";

interface ImageUploadProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  error?: string;
}

export const ImageUpload = ({ value, onChange, error }: ImageUploadProps) => {
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!validateFile(file)) {
        throw new Error("Invalid file type or size");
      }

      const base64 = await fileToBase64(file);
      onChange(base64);
    } catch {
      onChange(null);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors ${error ? 'border-red-500' : ''
          }`}
        onClick={() => document.getElementById('logo-upload')?.click()}
      >
        {value ? (
          <div className="relative w-32 h-32 mx-auto">
            <Image
              src={value}
              alt="Organization logo"
              width={128}
              height={128}
              className="object-cover rounded-lg"
              priority
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground" />
            <Label
              htmlFor="logo-upload"
              className="mt-4 block font-medium cursor-pointer"
            >
              Upload Organization Logo
              <span className="block text-sm text-muted-foreground mt-1">
                Max size: 5MB. Supported formats: JPG, PNG, WebP
              </span>
            </Label>
          </>
        )}
        <input
          id="logo-upload"
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};