"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createMateriel, updateMateriel } from "@/app/(app)/materiels/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { uploadMaterielPhoto } from "@/lib/supabase/storage";
import { MATERIEL_TYPES, codePrefixForType } from "@/lib/utils/materiel-taxonomy";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EmployeOption = { id: string; prenom: string; nom: string; departement: string };

const TYPE_OPTIONS = [...MATERIEL_TYPES, "Autre"] as const;

const schema = z
  .object({
    code_materiel: z.string().min(1),
    type: z.string().min(1),
    marque: z.string().optional(),
    modele: z.string().optional(),
    numero_serie: z.string().optional(),
    site: z.string().optional(),
    statut: z.enum(["Stock", "Attribué", "Maintenance", "Transit"]),
    etat: z.enum(["Neuf", "Bon", "Moyen", "À réparer", "Hors service"]),
    beneficiaire_type: z.enum(["employe", "departement", "societe"]).optional(),
    employe_id: z.string().optional(),
    beneficiaire_label: z.string().optional(),
    date_attribution: z.string().optional(),
    date_achat: z.string().optional(),
    cout: z.string().optional(),
    nom_device: z.string().optional(),
    adresse_mac: z.string().optional(),
    adresse_ip: z.string().optional(),
    observations: z.string().optional(),
    salle: z.string().optional(),
    photo_url: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.statut !== "Attribué") return;

    const bt = values.beneficiaire_type ?? "employe";

    if (bt === "employe" && !values.employe_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["employe_id"],
        message: "Veuillez sélectionner un employé.",
      });
    }

    if (bt !== "employe" && !values.beneficiaire_label) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["beneficiaire_label"],
        message: "Veuillez renseigner le bénéficiaire.",
      });
    }
  });

type Values = z.infer<typeof schema>;

export function MaterielFormDialog({
  mode = "create",
  initialValues,
  triggerLabel,
  triggerVariant,
}: {
  mode?: "create" | "edit";
  initialValues?: (Partial<Values> & { id: string }) | null;
  triggerLabel?: string;
  triggerVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
}) {
  const [open, setOpen] = React.useState(false);
  const [employes, setEmployes] = React.useState<EmployeOption[]>([]);
  const [loadingEmployes, setLoadingEmployes] = React.useState(false);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      statut: "Stock",
      etat: "Bon",
      beneficiaire_type: "employe",
      date_attribution: new Date().toISOString().slice(0, 10),
    },
  });

  const statut = form.watch("statut");
  const beneficiaireType = form.watch("beneficiaire_type");
  const watchedType = form.watch("type");
  const codePlaceholder = `${codePrefixForType(watchedType)}-001`;

  React.useEffect(() => {
    if (statut !== "Attribué") return;

    let cancelled = false;
    async function load() {
      try {
        setLoadingEmployes(true);
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("employes")
          .select("id, prenom, nom, departement")
          .order("prenom")
          .returns<EmployeOption[]>();
        if (error) throw new Error(error.message);
        if (!cancelled) setEmployes(data ?? []);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur de chargement des employés");
      } finally {
        if (!cancelled) setLoadingEmployes(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [statut]);

  React.useEffect(() => {
    if (!open) return;
    if (mode !== "edit" || !initialValues?.id) return;

    const initialStatut = (initialValues.statut as Values["statut"]) ?? "Stock";
    if (initialStatut !== "Attribué") return;

    const hasBeneficiaire =
      Boolean(initialValues.employe_id) ||
      Boolean(initialValues.beneficiaire_type) ||
      Boolean(initialValues.beneficiaire_label) ||
      Boolean(initialValues.date_attribution);

    if (hasBeneficiaire) return;

    const materielId = initialValues.id;
    let cancelled = false;
    async function loadActiveAttribution() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("attributions")
          .select("beneficiaire_type, beneficiaire_label, employe_id, date_attribution")
          .eq("materiel_id", materielId)
          .eq("statut", "Actif")
          .order("date_attribution", { ascending: false })
          .maybeSingle<{
            beneficiaire_type: "employe" | "departement" | "societe" | null;
            beneficiaire_label: string | null;
            employe_id: string | null;
            date_attribution: string;
          }>();

        if (error) throw new Error(error.message);
        if (!data || cancelled) return;

        form.setValue("beneficiaire_type", (data.beneficiaire_type ?? "employe") as any);
        form.setValue("beneficiaire_label", data.beneficiaire_label ?? undefined);
        form.setValue("employe_id", data.employe_id ?? undefined);
        form.setValue("date_attribution", data.date_attribution ?? undefined);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur lors du chargement de l'attribution");
      }
    }

    loadActiveAttribution();
    return () => {
      cancelled = true;
    };
  }, [open, mode, initialValues, form]);

  React.useEffect(() => {
    if (!open) return;
    if (mode !== "edit" || !initialValues) {
      form.reset({
        statut: "Stock",
        etat: "Bon",
        beneficiaire_type: "employe",
        date_attribution: new Date().toISOString().slice(0, 10),
      });
      return;
    }

    form.reset({
      code_materiel: initialValues.code_materiel ?? "",
      type: initialValues.type ?? "",
      marque: initialValues.marque ?? undefined,
      modele: initialValues.modele ?? undefined,
      numero_serie: initialValues.numero_serie ?? undefined,
      site: initialValues.site ?? undefined,
      statut: (initialValues.statut as Values["statut"]) ?? "Stock",
      etat: (initialValues.etat as Values["etat"]) ?? "Bon",
      beneficiaire_type:
        (initialValues.beneficiaire_type as Values["beneficiaire_type"]) ?? "employe",
      employe_id: initialValues.employe_id ?? undefined,
      beneficiaire_label: initialValues.beneficiaire_label ?? undefined,
      date_attribution:
        initialValues.date_attribution ?? new Date().toISOString().slice(0, 10),
      date_achat: initialValues.date_achat ?? undefined,
      cout: initialValues.cout ?? undefined,
      nom_device: initialValues.nom_device ?? undefined,
      adresse_mac: initialValues.adresse_mac ?? undefined,
      adresse_ip: initialValues.adresse_ip ?? undefined,
      observations: initialValues.observations ?? undefined,
      salle: initialValues.salle ?? undefined,
      photo_url: initialValues.photo_url ?? undefined,
    });
    setPhotoPreview(initialValues.photo_url ?? null);
  }, [open, mode, initialValues, form]);

  async function onSubmit(values: Values) {
    try {
      if (mode === "edit") {
        if (!initialValues?.id) throw new Error("Identifiant matériel manquant");
        await updateMateriel({
          id: initialValues.id,
          code_materiel: values.code_materiel,
          type: values.type,
          marque: values.marque || null,
          modele: values.modele || null,
          numero_serie: values.numero_serie || null,
          site: values.site || null,
          statut: values.statut,
          etat: values.etat,
          beneficiaire_type:
            values.statut === "Attribué" ? values.beneficiaire_type ?? "employe" : null,
          beneficiaire_label:
            values.statut === "Attribué" ? values.beneficiaire_label || null : null,
          employe_id:
            values.statut === "Attribué" && (values.beneficiaire_type ?? "employe") === "employe"
              ? values.employe_id || null
              : null,
          date_attribution:
            values.statut === "Attribué" ? values.date_attribution || null : null,
          date_achat: values.date_achat || null,
          cout: values.cout ? Number(values.cout) : null,
          nom_device: values.nom_device || null,
          adresse_mac: values.adresse_mac || null,
          adresse_ip: values.adresse_ip || null,
          observations: values.observations || null,
          salle: values.salle || null,
          photo_url: values.photo_url || null,
        });
        toast.success("Matériel modifié");
        setOpen(false);
      } else {
        await createMateriel({
          code_materiel: values.code_materiel,
          type: values.type,
          marque: values.marque || null,
          modele: values.modele || null,
          numero_serie: values.numero_serie || null,
          site: values.site || null,
          statut: values.statut,
          etat: values.etat,
          beneficiaire_type:
            values.statut === "Attribué" ? values.beneficiaire_type ?? "employe" : null,
          beneficiaire_label:
            values.statut === "Attribué" ? values.beneficiaire_label || null : null,
          employe_id:
            values.statut === "Attribué" && (values.beneficiaire_type ?? "employe") === "employe"
              ? values.employe_id || null
              : null,
          date_attribution:
            values.statut === "Attribué" ? values.date_attribution || null : null,
          date_achat: values.date_achat || null,
          cout: values.cout ? Number(values.cout) : null,
          nom_device: values.nom_device || null,
          adresse_mac: values.adresse_mac || null,
          adresse_ip: values.adresse_ip || null,
          observations: values.observations || null,
          salle: values.salle || null,
          photo_url: values.photo_url || null,
        });

        toast.success("Matériel ajouté");
        setPhotoPreview(null);
        form.reset({
          statut: "Stock",
          etat: "Bon",
          beneficiaire_type: "employe",
          date_attribution: new Date().toISOString().slice(0, 10),
        });
        setOpen(false);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la création");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant ?? "default"}>
          {triggerLabel ?? (mode === "edit" ? "Modifier" : "Ajouter")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Modifier matériel" : "Nouveau matériel"}</DialogTitle>
          <DialogDescription>
            Ajoute un matériel au parc (inventaire, info technique, statut).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code_materiel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code matériel</FormLabel>
                    <FormControl>
                      <Input placeholder={codePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choisir un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="marque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marque</FormLabel>
                    <FormControl>
                      <Input placeholder="HP" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="modele"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modèle</FormLabel>
                    <FormControl>
                      <Input placeholder="Elitebook 840 G5" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="numero_serie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° série</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nom_device"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom device</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="adresse_mac"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MAC</FormLabel>
                    <FormControl>
                      <Input placeholder="AA:BB:CC:DD:EE:FF" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="adresse_ip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP</FormLabel>
                    <FormControl>
                      <Input placeholder="192.168.1.10" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="etat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>État</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Neuf">Neuf</SelectItem>
                        <SelectItem value="Bon">Bon</SelectItem>
                        <SelectItem value="Moyen">Moyen</SelectItem>
                        <SelectItem value="À réparer">À réparer</SelectItem>
                        <SelectItem value="Hors service">Hors service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Stock">Stock</SelectItem>
                        <SelectItem value="Attribué">Attribué</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Transit">Transit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {statut === "Attribué" && (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="beneficiaire_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bénéficiaire</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="employe">Employé</SelectItem>
                            <SelectItem value="departement">Département</SelectItem>
                            <SelectItem value="societe">Société</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date_attribution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'attribution</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {beneficiaireType === "employe" ? (
                  <FormField
                    control={form.control}
                    name="employe_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employé</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full" disabled={loadingEmployes}>
                              <SelectValue
                                placeholder={
                                  loadingEmployes
                                    ? "Chargement..."
                                    : "Choisir un employé"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employes.map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                {e.prenom} {e.nom} — {e.departement}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="beneficiaire_label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {beneficiaireType === "societe" ? "Société" : "Département"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={beneficiaireType === "societe" ? "Nom société" : "Ex: IT"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date_achat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'achat</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coût (FCFA)</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" placeholder="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="salle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salle / Localisation</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Bâtiment A - Étage 2 - Bureau 205" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Photo du matériel</FormLabel>
              <div className="mt-2 flex flex-col gap-3">
                {photoPreview && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        form.setValue("photo_url", undefined);
                      }}
                      className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent w-fit">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">
                      {uploadingPhoto ? "Upload en cours..." : "Choisir une photo"}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingPhoto}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        setUploadingPhoto(true);
                        const url = await uploadMaterielPhoto(file);
                        if (url) {
                          setPhotoPreview(url);
                          form.setValue("photo_url", url);
                          toast.success("Photo uploadée");
                        } else {
                          toast.error("Erreur lors de l'upload");
                        }
                      } catch (error) {
                        toast.error("Erreur lors de l'upload");
                      } finally {
                        setUploadingPhoto(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observations</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Enregistrement..." : mode === "edit" ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
