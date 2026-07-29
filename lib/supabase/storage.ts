import { createSupabaseBrowserClient } from "./browser";

export async function uploadMaterielPhoto(file: File): Promise<string | null> {
  try {
    const supabase = createSupabaseBrowserClient();
    
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload du fichier
    const { data, error } = await supabase.storage
      .from('materiel-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('materiel-photos')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadMaterielPhoto:', error);
    return null;
  }
}

export async function deleteMaterielPhoto(photoUrl: string): Promise<boolean> {
  try {
    const supabase = createSupabaseBrowserClient();
    
    // Extraire le nom du fichier de l'URL
    const fileName = photoUrl.split('/').pop();
    if (!fileName) return false;

    const { error } = await supabase.storage
      .from('materiel-photos')
      .remove([fileName]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteMaterielPhoto:', error);
    return false;
  }
}
