import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Image as ImageIcon, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminHeader, AdminSidebar } from "./dashboard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DEFAULT_HOME_GALLERY_IMAGES, HOME_GALLERY_SETTINGS_KEY, parseHomeGalleryImages } from "@/lib/home-gallery";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring";

export default function AdminGallery() {
  const { toast } = useToast();
  const fileRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const [images, setImages] = useState<string[]>([...DEFAULT_HOME_GALLERY_IMAGES]);
  const [isDirty, setIsDirty] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings) {
      setImages(parseHomeGalleryImages(settings[HOME_GALLERY_SETTINGS_KEY]));
      setIsDirty(false);
    }
  }, [settings]);

  const setFileRef = useCallback((index: number, element: HTMLInputElement | null) => {
    if (element) {
      fileRefs.current.set(index, element);
    } else {
      fileRefs.current.delete(index);
    }
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (nextImages: string[]) => {
      return apiRequest("PATCH", "/api/settings", {
        [HOME_GALLERY_SETTINGS_KEY]: JSON.stringify(nextImages),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setIsDirty(false);
      toast({ title: "Gallery updated successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gallery save failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateImage = (index: number, value: string) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setIsDirty(true);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) {
      return;
    }
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setIsDirty(true);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setIsDirty(true);
  };

  const addImage = () => {
    setImages((prev) => [...prev, ""]);
    setIsDirty(true);
  };

  const resetToDefault = () => {
    setImages([...DEFAULT_HOME_GALLERY_IMAGES]);
    setIsDirty(true);
  };

  const uploadImage = async (file: File, index: number) => {
    const formData = new FormData();
    formData.append("image", file);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    setUploadingIndex(index);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      updateImage(index, data.url);
    } catch (err: any) {
      clearTimeout(timeoutId);
      const msg = "Image upload nahi ho paya, dobara try karo.";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSave = () => {
    const cleanImages = images.map((image) => image.trim()).filter(Boolean);
    if (cleanImages.length === 0) {
      toast({
        title: "At least 1 image required",
        description: "Gallery me kam se kam ek image URL hona chahiye.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(cleanImages);
  };

  return (
    <div className="flex h-screen w-full bg-section-alt overflow-hidden">
      <AdminSidebar active="/admin/gallery" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader title="Homepage Gallery" />
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="bg-card border border-border rounded-md p-6 space-y-5" data-testid="card-admin-gallery">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-foreground text-base font-semibold">Designed for Perfection Gallery</h3>
                  <p className="text-muted-foreground text-sm">
                    Home page ke moving images yahan edit, reorder aur upload karo.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetToDefault}
                  className="bg-background"
                  data-testid="button-gallery-reset-default"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Default
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending || !isDirty}
                  data-testid="button-gallery-save"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save Gallery"}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="h-24 rounded-md bg-muted animate-pulse" />
            ) : (
              <div className="space-y-3">
                {images.map((imageUrl, index) => (
                  <div key={index} className="rounded-md border border-border bg-background p-3" data-testid={`row-gallery-image-${index}`}>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground font-medium">Image #{index + 1}</p>
                      </div>
                      <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                        <input
                          value={imageUrl}
                          onChange={(event) => updateImage(index, event.target.value)}
                          className={inputClass}
                          placeholder="Paste image URL or upload file"
                          data-testid={`input-gallery-image-${index}`}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(element) => setFileRef(index, element)}
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            await uploadImage(file, index);
                            event.target.value = "";
                          }}
                          data-testid={`file-gallery-image-${index}`}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={uploadingIndex === index}
                            onClick={() => fileRefs.current.get(index)?.click()}
                            className="bg-background"
                            data-testid={`button-gallery-upload-${index}`}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={index === 0}
                            onClick={() => moveImage(index, index - 1)}
                            className="bg-background"
                            data-testid={`button-gallery-up-${index}`}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={index === images.length - 1}
                            onClick={() => moveImage(index, index + 1)}
                            className="bg-background"
                            data-testid={`button-gallery-down-${index}`}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeImage(index)}
                            className="bg-background text-red-400 hover:text-red-300"
                            data-testid={`button-gallery-remove-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {imageUrl.trim() && (
                        <div className="h-32 w-full max-w-xs overflow-hidden rounded-md border border-border bg-muted" data-testid={`preview-gallery-image-${index}`}>
                          <img src={imageUrl} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addImage}
                  className="bg-background"
                  data-testid="button-gallery-add-image"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
