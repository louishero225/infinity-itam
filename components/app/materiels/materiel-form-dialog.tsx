"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createMateriel, suggestNextMaterielCode, updateMateriel } from "@/app/(app)/materiels/actions";
import { getEntites, type EntiteRow } from "@/app/(app)/entites/actions";
import { EntiteSelect } from "@/components/app/beneficiaire/entite-select";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { uploadMaterielPhoto } from "@/lib/supabase/storage";
import { MATERIEL_TYPES, codePrefixForType } from "@/lib/utils/materiel-taxonomy";
import { MaterielIcon } from "@/lib/utils/materiel-icons";
import {
  ACCESSOIRE_SOUS_CATEGORIES,
  AccessoireSousIcon,
} from "@/lib/utils/accessoire-sous-categories";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { FormDialogContent } from "@/components/app/form-dialog-content";
import { useAccess } from "@/components/app/access-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
    sous_categorie: z.string().optional(),
    marque: z.string().optional(),
    modele: z.string().optional(),
    numero_serie: z.string().optional(),
    site: z.string().optional(),
    statut: z.enum([
      "Stock",
      "Attribué",
      "Maintenance",
      "Transit",
      "Réformé",
      "Cédé",
      "Volé",
      "Perdu",
    ]),
    etat: z.enum(["Neuf", "Bon", "Moyen", "À réparer", "Hors service"]),
    beneficiaire_type: z.enum(["employe", "departement", "societe"]).optional(),
    employe_id: z.string().optional(),
    entite_id: z.string().optional(),
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
    if (values.type === "Accessoire" && !values.sous_categorie?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sous_categorie"],
        message: "Choisissez une sous-catégorie d'accessoire.",
      });
    }

    if (values.statut !== "Attribué") return;

    const bt = values.beneficiaire_type ?? "employe";

    if (bt === "employe" && !values.employe_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["employe_id"],
        message: "Veuillez sélectionner un employé.",
      });
    }

    if (bt !== "employe" && !values.entite_id && !values.beneficiaire_label) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entite_id"],
        message: "Veuillez sélectionner une entité.",
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
  const { canWrite } = useAccess();
  const [employes, setEmployes] = React.useState<EmployeOption[]>([]);
  const [entites, setEntites] = React.useState<EntiteRow[]>([]);
  const [loadingEmployes, setLoadingEmployes] = React.useState(false);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [suggestedCode, setSuggestedCode] = React.useState<string | null>(null);
  const [loadingSuggestedCode, setLoadingSuggestedCode] = React.useState(false);
  const codeManuallyEdited = React.useRef(false);

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
  const codePlaceholder = suggestedCode ?? `${codePrefixForType(watchedType)}-001`;

  React.useEffect(() => {
    if (!open || mode !== "create" || !watchedType || codeManuallyEdited.current) {
      if (!watchedType) setSuggestedCode(null);
      return;
    }

    let cancelled = false;

    async function loadSuggestedCode() {
      try {
        setLoadingSuggestedCode(true);
        const next = await suggestNextMaterielCode(watchedType);
        if (cancelled) return;
        setSuggestedCode(next);
        form.setValue("code_materiel", next, { shouldValidate: true });
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e instanceof Error ? e.message : "Impossible de proposer un code matériel"
          );
        }
      } finally {
        if (!cancelled) setLoadingSuggestedCode(false);
      }
    }

    loadSuggestedCode();
    return () => {
      cancelled = true;
    };
  }, [open, mode, watchedType, form]);

  React.useEffect(() => {
    if (statut !== "Attribué") return;

    let cancelled = false;
    async function load() {
      try {
        setLoadingEmployes(true);
        const supabase = createSupabaseBrowserClient();
        const [empRes, entiteList] = await Promise.all([
          supabase
            .from("employes")
            .select("id, prenom, nom, departement")
            .order("prenom")
            .returns<EmployeOption[]>(),
          getEntites(),
        ]);
        if (empRes.error) throw new Error(empRes.error.message);
        if (!cancelled) {
          setEmployes(empRes.data ?? []);
          setEntites(entiteList);
        }
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
          .select("beneficiaire_type, beneficiaire_label, employe_id, entite_id, date_attribution")
          .eq("materiel_id", materielId)
          .eq("statut", "Actif")
          .order("date_attribution", { ascending: false })
          .maybeSingle<{
            beneficiaire_type: "employe" | "departement" | "societe" | null;
            beneficiaire_label: string | null;
            employe_id: string | null;
            entite_id: string | null;
            date_attribution: string;
          }>();

        if (error) throw new Error(error.message);
        if (!data || cancelled) return;

        form.setValue("beneficiaire_type", (data.beneficiaire_type ?? "employe") as Values["beneficiaire_type"]);
        form.setValue("beneficiaire_label", data.beneficiaire_label ?? undefined);
        form.setValue("employe_id", data.employe_id ?? undefined);
        form.setValue("entite_id", data.entite_id ?? undefined);
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
      codeManuallyEdited.current = false;
      setSuggestedCode(null);
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
      sous_categorie: initialValues.sous_categorie ?? undefined,
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
          sous_categorie: values.sous_categorie || null,
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
          entite_id:
            values.statut === "Attribué" && (values.beneficiaire_type ?? "employe") !== "employe"
              ? values.entite_id || null
              : null,
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
          sous_categorie: values.sous_categorie || null,
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
          entite_id:
            values.statut === "Attribué" && (values.beneficiaire_type ?? "employe") !== "employe"
              ? values.entite_id || null
              : null,
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
        codeManuallyEdited.current = false;
        setSuggestedCode(null);
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

  if (!canWrite) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant ?? "default"}>
          {triggerLabel ?? (mode === "edit" ? "Modifier" : "Ajouter")}
        </Button>
      </DialogTrigger>
      <FormDialogContent
        size="xl"
        className="gap-3 overflow-hidden p-4 sm:max-w-5xl max-h-[min(92vh,880px)]"
      >
        <DialogHeader className="space-y-1 pr-6">
          <DialogTitle className="text-base">
            {mode === "edit" ? "Modifier matériel" : "Nouveau matériel"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Inventaire, statut et attribution — champs secondaires en option.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-2.5"
          >
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-xs">Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Choisir un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            <span className="inline-flex items-center gap-2">
                              <MaterielIcon type={t} className="size-3.5 text-muted-foreground" />
                              {t}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedType === "Accessoire" ? (
                <FormField
                  control={form.control}
                  name="sous_categorie"
                  render={({ field }) => (
                    <FormItem className="gap-1">
                      <FormLabel className="text-xs">Sous-catégorie</FormLabel>
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Souris, chargeur…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACCESSOIRE_SOUS_CATEGORIES.map((s) => (
                            <SelectItem key={s} value={s}>
                              <span className="inline-flex items-center gap-2">
                                <AccessoireSousIcon
                                  sous={s}
                                  className="size-3.5 text-muted-foreground"
                                />
                                {s}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="code_materiel"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-xs">Code matériel</FormLabel>
                    <FormControl>
                      <Input
                        className="h-9"
                        placeholder={codePlaceholder}
                        {...field}
                        onChange={(event) => {
                          if (mode === "create") {
                            codeManuallyEdited.current = true;
                          }
                          field.onChange(event);
                        }}
                      />
                    </FormControl>
                    {mode === "create" && watchedType && suggestedCode ? (
                      <FormDescription className="text-[10px] leading-tight">
                        Proposé : {suggestedCode}
                      </FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marque"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-xs">Marque</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="HP" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="modele"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-xs">Modèle</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="Elitebook 840" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numero_serie"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-xs">N° série</FormLabel>
                    <FormControl>
                      <Input className="h-9" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="etat"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-xs">État</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-full">
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
                  <FormItem className="gap-1">
                    <FormLabel className="text-xs">Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Stock">Stock</SelectItem>
                        <SelectItem value="Attribué">Attribué</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Transit">Transit</SelectItem>
                        <SelectItem value="Réformé">Réformé</SelectItem>
                        <SelectItem value="Cédé">Cédé</SelectItem>
                        <SelectItem value="Volé">Volé</SelectItem>
                        <SelectItem value="Perdu">Perdu</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salle"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-xs">Salle / localisation</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="Bureau 205" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_achat"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-xs">Date d&apos;achat</FormLabel>
                    <FormControl>
                      <Input className="h-9" type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cout"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-xs">Coût (FCFA)</FormLabel>
                    <FormControl>
                      <Input className="h-9" inputMode="decimal" placeholder="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nom_device"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-xs">Nom device</FormLabel>
                    <FormControl>
                      <Input className="h-9" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {statut === "Attribué" ? (
              <div className="bg-muted/40 grid gap-2.5 rounded-md border p-2.5 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="beneficiaire_type"
                  render={({ field }) => (
                    <FormItem className="gap-1">
                      <FormLabel className="text-xs">Bénéficiaire</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="employe">Personne (employé)</SelectItem>
                          <SelectItem value="departement">Département / entité</SelectItem>
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
                    <FormItem className="gap-1">
                      <FormLabel className="text-xs">Date d&apos;attribution</FormLabel>
                      <FormControl>
                        <Input className="h-9" type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {beneficiaireType === "employe" ? (
                  <FormField
                    control={form.control}
                    name="employe_id"
                    render={({ field }) => (
                      <FormItem className="gap-1 sm:col-span-2 lg:col-span-1">
                        <FormLabel className="text-xs">Employé</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-9 w-full" disabled={loadingEmployes}>
                              <SelectValue
                                placeholder={loadingEmployes ? "Chargement…" : "Choisir"}
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
                    name="entite_id"
                    render={({ field }) => (
                      <FormItem className="gap-1 sm:col-span-2 lg:col-span-1">
                        <FormLabel className="text-xs">
                          {beneficiaireType === "societe" ? "Société" : "Département"}
                        </FormLabel>
                        <FormControl>
                          <EntiteSelect
                            entites={entites}
                            type={beneficiaireType === "societe" ? "societe" : "departement"}
                            value={field.value}
                            onValueChange={(id, entite) => {
                              field.onChange(id);
                              form.setValue("beneficiaire_label", entite.nom);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            ) : null}

            <details className="group rounded-md border">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none px-3 py-2 text-xs font-medium select-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-1.5">
                  Détails optionnels
                  <span className="text-[10px] font-normal opacity-70">
                    (MAC, IP, photo, observations)
                  </span>
                </span>
              </summary>
              <div className="grid gap-2.5 border-t p-2.5 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="adresse_mac"
                  render={({ field }) => (
                    <FormItem className="gap-1">
                      <FormLabel className="text-xs">MAC</FormLabel>
                      <FormControl>
                        <Input className="h-9" placeholder="AA:BB:CC:DD:EE:FF" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adresse_ip"
                  render={({ field }) => (
                    <FormItem className="gap-1">
                      <FormLabel className="text-xs">IP</FormLabel>
                      <FormControl>
                        <Input className="h-9" placeholder="192.168.1.10" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="gap-1">
                  <FormLabel className="text-xs">Photo</FormLabel>
                  <div className="mt-1 flex items-center gap-2">
                    {photoPreview ? (
                      <div className="relative size-10 shrink-0 overflow-hidden rounded border">
                        <Image
                          src={photoPreview}
                          alt="Aperçu"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null);
                            form.setValue("photo_url", undefined);
                          }}
                          className="bg-destructive absolute top-0 right-0 rounded-bl p-0.5 text-white"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    ) : null}
                    <label className="cursor-pointer">
                      <div className="hover:bg-accent inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs">
                        <Upload className="size-3.5" />
                        {uploadingPhoto ? "Upload…" : "Choisir"}
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
                              toast.success("Photo téléversée");
                            } else {
                              toast.error("Erreur lors de l'upload");
                            }
                          } catch {
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
                    <FormItem className="gap-1 sm:col-span-2 lg:col-span-3">
                      <FormLabel className="text-xs">Observations</FormLabel>
                      <FormControl>
                        <Textarea rows={2} className="min-h-0 resize-none" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </details>

            <DialogFooter className="mt-1 gap-2 sm:justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Enregistrement..."
                  : mode === "edit"
                    ? "Modifier"
                    : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </FormDialogContent>
    </Dialog>
  );
}
