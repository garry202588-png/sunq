import { supabase } from "./supabase";

export interface GalleryItem {
  id: string;
  type: "draw" | "restyle" | "ppt";
  imageUrl: string;
  prompt: string;
  style: string;
  createdAt: string;
}

interface GalleryRow {
  id: string;
  type: string;
  image_url: string;
  prompt: string;
  style: string;
  created_at: string;
}

function rowToItem(row: GalleryRow): GalleryItem {
  return {
    id: row.id,
    type: row.type as GalleryItem["type"],
    imageUrl: row.image_url,
    prompt: row.prompt,
    style: row.style,
    createdAt: row.created_at,
  };
}

export async function getGallery(): Promise<GalleryItem[]> {
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getGallery error:", error);
    return [];
  }

  return (data as GalleryRow[]).map(rowToItem);
}

export async function addToGallery(
  item: Omit<GalleryItem, "id" | "createdAt">
): Promise<GalleryItem | null> {
  const { data, error } = await supabase
    .from("gallery")
    .insert({
      type: item.type,
      image_url: item.imageUrl,
      prompt: item.prompt,
      style: item.style,
    })
    .select()
    .single();

  if (error) {
    console.error("addToGallery error:", error);
    return null;
  }

  return rowToItem(data as GalleryRow);
}

export async function removeFromGallery(id: string): Promise<void> {
  const { error } = await supabase.from("gallery").delete().eq("id", id);

  if (error) {
    console.error("removeFromGallery error:", error);
  }
}
