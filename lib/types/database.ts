export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
    Tables: {}
    Views: {}
  }
  public: {
    Tables: {
      alertes: {
        Row: {
          created_at: string | null
          date_echeance: string | null
          description: string | null
          id: string
          licence_id: string | null
          materiel_id: string | null
          priorite: string
          statut: string
          titre: string
          traitee_le: string | null
          traitee_par: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_echeance?: string | null
          description?: string | null
          id?: string
          licence_id?: string | null
          materiel_id?: string | null
          priorite?: string
          statut?: string
          titre: string
          traitee_le?: string | null
          traitee_par?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_echeance?: string | null
          description?: string | null
          id?: string
          licence_id?: string | null
          materiel_id?: string | null
          priorite?: string
          statut?: string
          titre?: string
          traitee_le?: string | null
          traitee_par?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      attributions: {
        Row: {
          accessoires: string | null
          beneficiaire_label: string | null
          beneficiaire_type: string | null
          commentaire: string | null
          created_at: string | null
          date_attribution: string
          date_restitution: string | null
          employe_id: string | null
          etat_remise: string | null
          etat_restitution: string | null
          id: string
          materiel_id: string | null
          numero_attribution: string | null
          statut: string | null
        }
        Insert: {
          accessoires?: string | null
          beneficiaire_label?: string | null
          beneficiaire_type?: string | null
          commentaire?: string | null
          created_at?: string | null
          date_attribution: string
          date_restitution?: string | null
          employe_id?: string | null
          etat_remise?: string | null
          etat_restitution?: string | null
          id?: string
          materiel_id?: string | null
          numero_attribution?: string | null
          statut?: string | null
        }
        Update: {
          accessoires?: string | null
          beneficiaire_label?: string | null
          beneficiaire_type?: string | null
          commentaire?: string | null
          created_at?: string | null
          date_attribution?: string
          date_restitution?: string | null
          employe_id?: string | null
          etat_remise?: string | null
          etat_restitution?: string | null
          id?: string
          materiel_id?: string | null
          statut?: string | null
        }
        Relationships: []
      }
      categories_images: {
        Row: {
          categorie: string
          couleur: string | null
          created_at: string | null
          icone: string | null
          id: string
          image_url: string | null
          ordre: number | null
        }
        Insert: {
          categorie: string
          couleur?: string | null
          created_at?: string | null
          icone?: string | null
          id?: string
          image_url?: string | null
          ordre?: number | null
        }
        Update: {
          categorie?: string
          couleur?: string | null
          created_at?: string | null
          icone?: string | null
          id?: string
          image_url?: string | null
          ordre?: number | null
        }
        Relationships: []
      }
      comptes_roles: {
        Row: {
          compte_id: string
          role_id: number
        }
        Insert: {
          compte_id: string
          role_id: number
        }
        Update: {
          compte_id?: string
          role_id?: number
        }
        Relationships: []
      }
      comptes_systeme: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      demandes_achat: {
        Row: {
          approbateur: string | null
          created_at: string | null
          date_approbation: string | null
          date_decaissement: string | null
          date_demande: string
          date_mise_production: string | null
          date_reception: string | null
          demandeur: string | null
          devis_url: string | null
          fournisseur: string | null
          id: string
          justification: string | null
          materiel_description: string
          materiel_id: string | null
          montant_total: number | null
          notes: string | null
          numero_demande: string
          priorite: string | null
          prix_unitaire: number | null
          quantite: number | null
          statut: string
          type_materiel: string | null
          updated_at: string | null
        }
        Insert: {
          approbateur?: string | null
          created_at?: string | null
          date_approbation?: string | null
          date_decaissement?: string | null
          date_demande: string
          date_mise_production?: string | null
          date_reception?: string | null
          demandeur?: string | null
          devis_url?: string | null
          fournisseur?: string | null
          id?: string
          justification?: string | null
          materiel_description: string
          materiel_id?: string | null
          montant_total?: number | null
          notes?: string | null
          numero_demande: string
          priorite?: string | null
          prix_unitaire?: number | null
          quantite?: number | null
          statut?: string
          type_materiel?: string | null
          updated_at?: string | null
        }
        Update: {
          approbateur?: string | null
          created_at?: string | null
          date_approbation?: string | null
          date_decaissement?: string | null
          date_demande?: string
          date_mise_production?: string | null
          date_reception?: string | null
          demandeur?: string | null
          devis_url?: string | null
          fournisseur?: string | null
          id?: string
          justification?: string | null
          materiel_description?: string
          materiel_id?: string | null
          montant_total?: number | null
          notes?: string | null
          numero_demande?: string
          priorite?: string | null
          prix_unitaire?: number | null
          quantite?: number | null
          statut?: string
          type_materiel?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employes: {
        Row: {
          created_at: string | null
          departement: string
          fonction: string | null
          id: string
          matricule: string | null
          nom: string
          prenom: string
          service: string | null
          site: string | null
          statut: string | null
        }
        Insert: {
          created_at?: string | null
          departement: string
          fonction?: string | null
          id?: string
          matricule?: string | null
          nom: string
          prenom: string
          service?: string | null
          site?: string | null
          statut?: string | null
        }
        Update: {
          created_at?: string | null
          departement?: string
          fonction?: string | null
          id?: string
          matricule?: string | null
          nom?: string
          prenom?: string
          service?: string | null
          site?: string | null
          statut?: string | null
        }
        Relationships: []
      }
      licences: {
        Row: {
          cle_produit: string | null
          contact_support: string | null
          cout: number | null
          created_at: string | null
          date_achat: string | null
          date_expiration: string | null
          editeur: string | null
          id: string
          materiel_id: string | null
          nom: string
          nombre_postes: number | null
          notes: string | null
          numero_licence: string | null
          postes_utilises: number | null
          statut: string
          type_licence: string | null
          updated_at: string | null
          url_telechargement: string | null
        }
        Insert: {
          cle_produit?: string | null
          contact_support?: string | null
          cout?: number | null
          created_at?: string | null
          date_achat?: string | null
          date_expiration?: string | null
          editeur?: string | null
          id?: string
          materiel_id?: string | null
          nom: string
          nombre_postes?: number | null
          notes?: string | null
          numero_licence?: string | null
          postes_utilises?: number | null
          statut?: string
          type_licence?: string | null
          updated_at?: string | null
          url_telechargement?: string | null
        }
        Update: {
          cle_produit?: string | null
          contact_support?: string | null
          cout?: number | null
          created_at?: string | null
          date_achat?: string | null
          date_expiration?: string | null
          editeur?: string | null
          id?: string
          materiel_id?: string | null
          nom?: string
          nombre_postes?: number | null
          notes?: string | null
          numero_licence?: string | null
          postes_utilises?: number | null
          statut?: string
          type_licence?: string | null
          updated_at?: string | null
          url_telechargement?: string | null
        }
        Relationships: []
      }
      materiels: {
        Row: {
          adresse_ip: string | null
          adresse_mac: string | null
          code_materiel: string
          cout: number | null
          created_at: string | null
          date_achat: string | null
          etat: string | null
          id: string
          marque: string | null
          modele: string | null
          nom_device: string | null
          numero_serie: string | null
          observations: string | null
          photo_url: string | null
          salle: string | null
          site: string | null
          statut: string | null
          type: string
        }
        Insert: {
          adresse_ip?: string | null
          adresse_mac?: string | null
          code_materiel: string
          cout?: number | null
          created_at?: string | null
          date_achat?: string | null
          etat?: string | null
          id?: string
          marque?: string | null
          modele?: string | null
          nom_device?: string | null
          numero_serie?: string | null
          observations?: string | null
          photo_url?: string | null
          salle?: string | null
          site?: string | null
          statut?: string | null
          type: string
        }
        Update: {
          adresse_ip?: string | null
          adresse_mac?: string | null
          code_materiel?: string
          cout?: number | null
          created_at?: string | null
          date_achat?: string | null
          etat?: string | null
          id?: string
          marque?: string | null
          modele?: string | null
          nom_device?: string | null
          numero_serie?: string | null
          observations?: string | null
          photo_url?: string | null
          salle?: string | null
          site?: string | null
          statut?: string | null
          type?: string
        }
        Relationships: []
      }
      reparations: {
        Row: {
          cout: number | null
          created_at: string | null
          date_debut: string
          date_fin: string | null
          description: string
          diagnostique: string | null
          id: string
          materiel_id: string
          numero_ticket: string | null
          pieces_changees: string | null
          prestataire: string | null
          priorite: string | null
          resolution: string | null
          statut: string
          type_intervention: string
          updated_at: string | null
        }
        Insert: {
          cout?: number | null
          created_at?: string | null
          date_debut: string
          date_fin?: string | null
          description: string
          diagnostique?: string | null
          id?: string
          materiel_id: string
          numero_ticket?: string | null
          pieces_changees?: string | null
          prestataire?: string | null
          priorite?: string | null
          resolution?: string | null
          statut?: string
          type_intervention: string
          updated_at?: string | null
        }
        Update: {
          cout?: number | null
          created_at?: string | null
          date_debut?: string
          date_fin?: string | null
          description?: string
          diagnostique?: string | null
          id?: string
          materiel_id?: string
          numero_ticket?: string | null
          pieces_changees?: string | null
          prestataire?: string | null
          priorite?: string | null
          resolution?: string | null
          statut?: string
          type_intervention?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          code: string
          id: number
        }
        Insert: {
          code: string
          id?: number
        }
        Update: {
          code?: string
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      v_alertes_actives: {
        Row: {
          code_materiel: string | null
          created_at: string | null
          date_echeance: string | null
          description: string | null
          id: string | null
          licence_nom: string | null
          materiel_type: string | null
          priorite: string | null
          titre: string | null
          type: string | null
          urgence: string | null
        }
        Relationships: []
      }
      v_demandes_achat_details: {
        Row: {
          alerte_delai: string | null
          code_materiel: string | null
          date_decaissement: string | null
          date_demande: string | null
          date_mise_production: string | null
          date_reception: string | null
          delai_livraison_jours: number | null
          delai_mise_production_jours: number | null
          demandeur: string | null
          fournisseur: string | null
          id: string | null
          materiel_description: string | null
          materiel_type_actuel: string | null
          montant_total: number | null
          numero_demande: string | null
          priorite: string | null
          prix_unitaire: number | null
          quantite: number | null
          statut: string | null
          type_materiel: string | null
        }
        Relationships: []
      }
      v_direction_materiel_attribue: {
        Row: {
          code_materiel: string | null
          date_attribution: string | null
          departement: string | null
          marque: string | null
          type: string | null
        }
        Relationships: []
      }
      v_direction_par_departement: {
        Row: {
          departement: string | null
          nombre_materiels: number | null
        }
        Relationships: []
      }
      v_direction_synthese: {
        Row: {
          cout_total_parc: number | null
          materiels_attribues: number | null
          materiels_en_stock: number | null
          total_materiels: number | null
        }
        Relationships: []
      }
      v_historique_attributions: {
        Row: {
          id: string | null
          code_materiel: string | null
          nom: string | null
          prenom: string | null
          departement: string | null
          date_attribution: string | null
          date_restitution: string | null
          statut: string | null
          action: string | null
          date_action: string | null
        }
        Relationships: []
      }
      v_reparations_details: {
        Row: {
          code_materiel: string | null
          cout: number | null
          date_debut: string | null
          date_fin: string | null
          description: string | null
          duree_jours: number | null
          id: string | null
          marque: string | null
          materiel_type: string | null
          modele: string | null
          prestataire: string | null
          priorite: string | null
          statut: string | null
          type_intervention: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_licence_expiration: { Args: never; Returns: undefined }
      has_role: { Args: { role_code: string }; Returns: boolean }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

type DefaultSchema = Database["public"]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
