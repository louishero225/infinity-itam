"use client";

import * as React from "react";
import { toast } from "sonner";
import { Shield, UserPlus, UserCheck } from "lucide-react";

import {
  createUserWithRoles,
  registerMyself,
  setUserRoles,
  type AdminUserRow,
} from "@/app/(app)/administration/users-actions";
import type { RoleCode } from "@/lib/auth/role-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ALL_ROLES: { code: RoleCode; label: string; hint: string }[] = [
  { code: "admin", label: "Admin", hint: "Administration + Audit" },
  { code: "itam", label: "IT / Support", hint: "Parc + tickets" },
  { code: "lecture", label: "Lecture", hint: "Consultation seule" },
  { code: "collaborateur", label: "Collaborateur", hint: "Portail Mes demandes" },
];

type Props = {
  users: AdminUserRow[];
  currentUserId: string;
  currentUserEmail: string | null;
  hasServiceRole: boolean;
  iAmRegistered: boolean;
};

export function UsersRolesPanel({
  users,
  currentUserId,
  currentUserEmail,
  hasServiceRole,
  iAmRegistered,
}: Props) {
  const [rows, setRows] = React.useState(users);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [newRoles, setNewRoles] = React.useState<RoleCode[]>(["itam"]);
  const [creating, setCreating] = React.useState(false);
  const [bootstrapping, setBootstrapping] = React.useState(false);

  React.useEffect(() => {
    setRows(users);
  }, [users]);

  async function toggleRole(user: AdminUserRow, role: RoleCode, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...user.roles, role]))
      : user.roles.filter((r) => r !== role);

    setSavingId(user.id);
    try {
      const result = await setUserRoles(user.id, next);
      setRows((prev) =>
        prev.map((r) =>
          r.id === user.id ? { ...r, roles: result.roles, source: "compte" } : r
        )
      );
      toast.success(`Rôles mis à jour pour ${user.email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      await createUserWithRoles({ email, password, roles: newRoles });
      toast.success(`Compte créé : ${email}`);
      setEmail("");
      setPassword("");
      setNewRoles(["itam"]);
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  async function handleRegisterMyself() {
    setBootstrapping(true);
    try {
      await registerMyself(["admin", "itam"]);
      toast.success("Vous êtes enregistré comme admin");
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBootstrapping(false);
    }
  }

  function toggleNewRole(code: RoleCode, checked: boolean) {
    setNewRoles((prev) =>
      checked ? Array.from(new Set([...prev, code])) : prev.filter((r) => r !== code)
    );
  }

  return (
    <div className="space-y-4">
      {!iAmRegistered && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="size-4" />
              Première configuration
            </CardTitle>
            <CardDescription>
              Enregistrez votre compte connecté
              {currentUserEmail ? ` (${currentUserEmail})` : ""} comme administrateur — sans SQL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRegisterMyself} disabled={bootstrapping}>
              {bootstrapping ? "Enregistrement…" : "M’enregistrer comme admin"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4" />
            Utilisateurs & rôles
          </CardTitle>
          <CardDescription>
            Cochez les rôles directement ici. Les changements sont immédiats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun utilisateur listé. Enregistrez-vous ci-dessus ou créez un compte.
            </p>
          ) : (
            rows.map((user) => {
              const isMe = user.id === currentUserId;
              const busy = savingId === user.id;
              return (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{user.email}</p>
                      {isMe && <Badge variant="secondary">Vous</Badge>}
                      {user.source === "auth" && user.roles.length === 0 && (
                        <Badge variant="outline">Pas encore de rôles</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground font-mono text-xs break-all">{user.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {ALL_ROLES.map((role) => {
                      const checked = user.roles.includes(role.code);
                      const lockAdmin = isMe && role.code === "admin" && checked;
                      return (
                        <label
                          key={role.code}
                          className="flex cursor-pointer items-start gap-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={busy || lockAdmin}
                            onCheckedChange={(v) =>
                              toggleRole(user, role.code, v === true)
                            }
                          />
                          <span>
                            <span className="font-medium">{role.label}</span>
                            <span className="text-muted-foreground block text-xs">
                              {role.hint}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4" />
            Nouvel utilisateur
          </CardTitle>
          <CardDescription>
            Crée le compte de connexion et assigne les rôles — entièrement depuis le web.
            {!hasServiceRole && (
              <span className="text-destructive mt-1 block">
                Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local et sur Vercel pour activer la
                création.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="admin-user-email">E-mail</Label>
            <Input
              id="admin-user-email"
              type="email"
              placeholder="prenom@entreprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!hasServiceRole}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-user-password">Mot de passe temporaire</Label>
            <Input
              id="admin-user-password"
              type="password"
              placeholder="min. 8 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!hasServiceRole}
            />
          </div>
          <div className="flex flex-wrap gap-4 sm:col-span-2">
            {ALL_ROLES.map((role) => (
              <label key={role.code} className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={newRoles.includes(role.code)}
                  disabled={!hasServiceRole}
                  onCheckedChange={(v) => toggleNewRole(role.code, v === true)}
                />
                <span>
                  <span className="font-medium">{role.label}</span>
                  <span className="text-muted-foreground block text-xs">{role.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="sm:col-span-2">
            <Button
              onClick={handleCreate}
              disabled={
                !hasServiceRole || creating || !email || password.length < 8 || newRoles.length === 0
              }
            >
              <UserPlus className="mr-2 size-4" />
              {creating ? "Création…" : "Créer le compte"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
