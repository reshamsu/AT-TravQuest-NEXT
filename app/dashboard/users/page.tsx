"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Eye, Pencil, Trash2, Search,
  Shield, ShieldCheck, UserCheck, UserX, Loader2, X, Mail, Phone,
  Star, Briefcase, User, EyeOff, KeyRound,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { canManageRole, canManageUsers, ROLE_DB_TO_KEY, type Role } from "@/lib/permissions";
import { useUser } from "@/app/dashboard/UserContext";
import { useCompany } from "@/app/dashboard/CompanyContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type DBRole  = "Super Admin" | "Admin" | "Manager" | "Agent" | "Staff";
type Status  = "Active" | "Inactive" | "Pending";

interface User {
  id:          string;
  name:        string;
  email:       string;
  phone:       string;
  role:        DBRole;
  status:      Status;
  agent_code?: string;
  created_at:  string;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const FIELD = "text-[11.5px] text-gray-600 dark:text-gray-400 font-semibold mb-1 block";
const INPUT = "w-full px-3 py-2 text-[12.5px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] focus:ring-2 focus:ring-[#00B5A3]/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200";

const ROLE_PILL: Record<DBRole, string> = {
  "Super Admin": "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800/30",
  Admin:         "bg-blue-50   dark:bg-blue-900/20   text-blue-700   dark:text-blue-400   border-blue-200   dark:border-blue-800/30",
  Manager:       "bg-amber-50  dark:bg-amber-900/20  text-amber-700  dark:text-amber-400  border-amber-200  dark:border-amber-800/30",
  Agent:         "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30",
  Staff:         "bg-gray-50   dark:bg-dk-raised     text-gray-500   dark:text-gray-400   border-gray-200   dark:border-dk-stroke",
};

const STATUS_PILL: Record<Status, string> = {
  Active:   "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30",
  Inactive: "bg-gray-50    dark:bg-dk-raised     text-gray-400    dark:text-gray-500    border-gray-200    dark:border-dk-stroke",
  Pending:  "bg-amber-50   dark:bg-amber-900/20  text-amber-700   dark:text-amber-400   border-amber-200   dark:border-amber-800/30",
};

const ROLE_ICON: Record<DBRole, React.ElementType> = {
  "Super Admin": Star,
  Admin:         ShieldCheck,
  Manager:       Shield,
  Agent:         Briefcase,
  Staff:         User,
};

const ALL_DB_ROLES: DBRole[] = ["Super Admin", "Admin", "Manager", "Agent", "Staff"];

// ── Component ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { role: sessionRole } = useUser();
  const actorRole: Role = sessionRole;
  const { company } = useCompany();

  const [users, setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe]         = useState<{ email: string; role: string } | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter]     = useState<DBRole | "All">("All");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");

  const [modal, setModal]   = useState<{ open: boolean; mode: "add" | "edit" | "view"; data: User | null }>({ open: false, mode: "add", data: null });
  const [form, setForm]     = useState({ name: "", email: "", phone: "", role: "Staff" as DBRole, status: "Active" as Status });
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [passwordError, setPasswordError]     = useState("");
  const [saving, setSaving] = useState(false);
  const setF = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null; name: string }>({ open: false, id: null, name: "" });

  const fetchUsers = useCallback(async () => {
    const res = await fetch(`/api/admin/users?company=${encodeURIComponent(company.label)}`);
    if (!res.ok) return;
    const body = await res.json() as { users: Record<string, unknown>[]; me: { email: string; role: string } };
    setMe(body.me);

    const rows = (body.users ?? []).map((u) => ({
      ...u,
      created_at: (u.created_at as string | undefined)?.slice(0, 10) ?? "",
      agent_code: (u.agent_code as string | undefined) ?? undefined,
    })) as User[];

    // Pin the logged-in user at the top
    if (body.me?.email) {
      const idx = rows.findIndex((u) => u.email === body.me.email);
      if (idx > 0) rows.unshift(...rows.splice(idx, 1));
    }

    setUsers(rows);
  }, [company.label]);

  useEffect(() => {
    Promise.resolve().then(async () => {
      setLoading(true);
      await fetchUsers();
      setLoading(false);
    });
  }, [fetchUsers]);

  // ── Filtered list
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.agent_code ?? "").toLowerCase().includes(q);
    const matchRole   = roleFilter   === "All" || u.role   === roleFilter;
    const matchStatus = statusFilter === "All" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const counts = {
    total:    users.length,
    active:   users.filter((u) => u.status === "Active").length,
    pending:  users.filter((u) => u.status === "Pending").length,
    inactive: users.filter((u) => u.status === "Inactive").length,
  };

  // ── Permission check: can the actor manage a user's role?
  function actorCanManage(targetDbRole: DBRole): boolean {
    const targetKey = ROLE_DB_TO_KEY[targetDbRole];
    if (!targetKey) return false;
    return canManageRole(actorRole, targetKey);
  }

  // ── Open modal
  function openModal(mode: "add" | "edit" | "view", data?: User) {
    setForm(
      data
        ? { name: data.name, email: data.email, phone: data.phone, role: data.role, status: data.status }
        : { name: "", email: "", phone: "", role: "Staff", status: "Active" },
    );
    setPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setShowPassword(false);
    setShowConfirm(false);
    setModal({ open: true, mode, data: data ?? null });
  }

  // ── Roles the current actor is allowed to assign
  const assignableRoles = ALL_DB_ROLES.filter((r) => {
    const key = ROLE_DB_TO_KEY[r];
    return key && canManageRole(actorRole, key);
  });

  // ── Save
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (modal.mode === "add") {
      if (!password) { setPasswordError("Password is required."); return; }
      if (password.length < 6) { setPasswordError("Password must be at least 6 characters."); return; }
      if (password !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
    } else if (modal.mode === "edit" && password) {
      if (password.length < 6) { setPasswordError("Password must be at least 6 characters."); return; }
      if (password !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
    }
    setPasswordError("");
    setSaving(true);

    const payload: Record<string, unknown> = { ...form };
    if (password) payload.password = password;

    if (modal.mode === "edit" && modal.data) {
      await fetch(`/api/admin/users/${modal.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, company: company.label }),
      });
    }
    await fetchUsers();
    setSaving(false);
    setModal({ open: false, mode: "add", data: null });
  }

  // ── Approve (Pending → Active)
  async function handleApprove(id: string) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Active" }),
    });
    setUsers((p) => p.map((u) => u.id === id ? { ...u, status: "Active" as Status } : u));
  }

  // ── Delete
  async function handleDelete(id: string) {
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setUsers((p) => p.filter((u) => u.id !== id));
  }

  const canWrite = actorRole !== "staff" && actorRole !== "agent";

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-100">Users</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Manage who has access to this dashboard.</p>
        </div>
        {canWrite && (
          <button onClick={() => openModal("add")} className="btn-primary-sm flex items-center gap-1.5">
            <Plus size={13} /> Add User
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users",   value: counts.total,    bg: "bg-violet-50 dark:bg-violet-900/20",  color: "text-violet-600 dark:text-violet-400",  icon: Users },
          { label: "Active",        value: counts.active,   bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-600 dark:text-emerald-400", icon: UserCheck },
          { label: "Pending",       value: counts.pending,  bg: "bg-amber-50 dark:bg-amber-900/20",   color: "text-amber-600 dark:text-amber-400",   icon: UserX },
          { label: "Inactive",      value: counts.inactive, bg: "bg-gray-50 dark:bg-dk-raised",    color: "text-gray-500 dark:text-gray-400",    icon: Shield },
        ].map(({ label, value, bg, color, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke p-5 hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}><Icon size={18} className={color} /></div>
            <p className="text-[24px] font-bold text-gray-900 dark:text-gray-100 leading-none mb-1.5">{value}</p>
            <p className="text-[12px] text-gray-400 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dk-surface rounded-2xl border border-gray-100 dark:border-dk-stroke overflow-hidden">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-50 dark:border-dk-stroke">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or agent code…"
              className="w-full pl-8 pr-3 py-2 text-[12px] bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-xl outline-none focus:border-[#00B5A3] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-200" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={12} /></button>}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["All", ...ALL_DB_ROLES] as const).map((r) => (
              <button key={r} onClick={() => setRoleFilter(r as DBRole | "All")}
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-all ${roleFilter === r ? "bg-[#00B5A3] text-white border-[#00B5A3]" : "bg-white dark:bg-dk-raised text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dk-stroke hover:border-[#00B5A3]/50 hover:text-[#00B5A3]"}`}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["All", "Active", "Inactive", "Pending"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s as Status | "All")}
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-all ${statusFilter === s ? "bg-[#00B5A3] text-white border-[#00B5A3]" : "bg-white dark:bg-dk-raised text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dk-stroke hover:border-[#00B5A3]/50 hover:text-[#00B5A3]"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Column headers */}
        <div className="overflow-x-auto"><div className="min-w-160"><div className="grid grid-cols-12 px-6 py-2.5 bg-gray-50/80 dark:bg-dk-raised/50 border-b border-gray-100 dark:border-dk-stroke">
          <span className="col-span-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</span>
          <span className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</span>
          <span className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</span>
          <span className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
          <span className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50 dark:divide-dk-stroke">
          {loading ? (
            <div className="px-6 py-12 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[13px]">Loading users…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-dk-raised flex items-center justify-center mx-auto mb-3"><Users size={20} className="text-gray-200 dark:text-gray-600" /></div>
              <p className="text-[13px] font-semibold text-gray-400">No users found</p>
              <p className="text-[11.5px] text-gray-300 mt-1">Try adjusting the search or filters.</p>
            </div>
          ) : filtered.map((user) => {
            const RoleIcon = ROLE_ICON[user.role] ?? User;
            const userInitials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const isMe = user.email === me?.email;
            const actorCanEdit = canWrite && actorCanManage(user.role);
            return (
              <div key={user.id} className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-gray-50/60 dark:hover:bg-dk-raised/30 transition-colors">
                {/* User */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#00B5A3]/10 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-[#00B5A3]">{userInitials}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[12.5px] font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                      {isMe && <span className="text-[9px] font-bold text-[#00B5A3] bg-[#00B5A3]/10 border border-[#00B5A3]/20 px-1.5 py-0.5 rounded-full shrink-0">You</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10.5px] text-gray-400 truncate">{user.created_at}</p>
                      {user.agent_code && (
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 px-1.5 py-0.5 rounded-full shrink-0">
                          {user.agent_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Contact */}
                <div className="col-span-3 min-w-0">
                  <p className="text-[11.5px] text-gray-600 dark:text-gray-400 truncate flex items-center gap-1"><Mail size={10} className="text-gray-300 shrink-0" />{user.email}</p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5"><Phone size={10} className="text-gray-300 shrink-0" />{user.phone || "—"}</p>
                </div>
                {/* Role */}
                <div className="col-span-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ${ROLE_PILL[user.role]}`}>
                    <RoleIcon size={9} />{user.role}
                  </span>
                </div>
                {/* Status */}
                <div className="col-span-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_PILL[user.status]}`}>{user.status}</span>
                </div>
                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button onClick={() => openModal("view", user)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dk-raised text-gray-400 hover:text-gray-600 transition-all" title="View"><Eye size={13} /></button>
                  {actorCanEdit && (
                    <>
                      {user.status === "Pending" && (
                        <button onClick={() => handleApprove(user.id)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                          title="Approve login access">
                          <UserCheck size={13} />
                        </button>
                      )}
                      <button onClick={() => openModal("edit", user)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dk-raised text-gray-400 hover:text-gray-600 transition-all" title="Edit"><Pencil size={13} /></button>
                      {!isMe && canManageUsers(actorRole) && (
                        <button onClick={() => setConfirmDelete({ open: true, id: user.id, name: user.name })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all" title="Delete"><Trash2 size={13} /></button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        </div></div>
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 dark:border-dk-stroke flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{filtered.length} of {users.length} users</span>
            <span className="text-[11px] text-gray-400">{counts.active} active · {counts.pending} pending · {counts.inactive} inactive</span>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: "add", data: null })}
        title={modal.mode === "view" ? (modal.data?.name ?? "") : modal.mode === "edit" ? "Edit User" : "Add User"}
      >
        {modal.mode === "view" && modal.data ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#00B5A3]/10 flex items-center justify-center">
                <span className="text-[16px] font-bold text-[#00B5A3]">
                  {modal.data.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{modal.data.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_PILL[modal.data.status]}`}>{modal.data.status}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_PILL[modal.data.role]}`}>{modal.data.role}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className={FIELD}>Email</p><p className="text-[12.5px] text-gray-700 dark:text-gray-300">{modal.data.email}</p></div>
              <div><p className={FIELD}>Phone</p><p className="text-[12.5px] text-gray-700 dark:text-gray-300">{modal.data.phone || "—"}</p></div>
              <div><p className={FIELD}>Joined</p><p className="text-[12.5px] text-gray-700 dark:text-gray-300">{modal.data.created_at}</p></div>
              {modal.data.agent_code && (
                <div>
                  <p className={FIELD}>Agent Code</p>
                  <p className="text-[12.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{modal.data.agent_code}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Sign in with code + password</p>
                </div>
              )}
            </div>
            {modal.data.status === "Pending" && canWrite && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">Login pending approval</p>
                  <p className="text-[10.5px] text-amber-600 dark:text-amber-500 mt-0.5">This user cannot sign in until you approve their access.</p>
                </div>
                <button
                  onClick={() => { handleApprove(modal.data!.id); setModal({ open: false, mode: "add", data: null }); }}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11.5px] font-semibold flex items-center gap-1.5 transition-all">
                  <UserCheck size={12} /> Approve
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div><label className={FIELD}>Full Name</label>
              <input required className={INPUT} placeholder="e.g. Jane Smith" value={form.name} onChange={(e) => setF("name", e.target.value)} />
            </div>
            <div><label className={FIELD}>Email Address</label>
              <input required type="email" className={INPUT} placeholder="jane@company.com" value={form.email} onChange={(e) => setF("email", e.target.value)} />
            </div>
            <div><label className={FIELD}>Phone</label>
              <input className={INPUT} placeholder="+1 555 0000" value={form.phone} onChange={(e) => setF("phone", e.target.value)} />
            </div>

            {/* Password / credentials section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound size={12} className="text-[#00B5A3]" />
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  {modal.mode === "add" ? "Login Credentials" : "Reset Password"}
                </span>
                {modal.mode === "edit" && (
                  <span className="text-[10px] text-gray-400 normal-case font-normal">— leave blank to keep existing</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={FIELD}>{modal.mode === "add" ? "Password" : "New Password"}</label>
                  <div className="relative">
                    <input
                      required={modal.mode === "add"}
                      type={showPassword ? "text" : "password"}
                      className={INPUT + " pr-9"}
                      placeholder={modal.mode === "add" ? "Min. 6 characters" : "Leave blank to keep"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={FIELD}>Confirm Password</label>
                  <div className="relative">
                    <input
                      required={modal.mode === "add"}
                      type={showConfirm ? "text" : "password"}
                      className={INPUT + " pr-9"}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              </div>
              {passwordError && (
                <p className="text-[11px] text-red-500 font-medium">{passwordError}</p>
              )}
              {form.role === "Agent" && modal.mode === "add" && (
                <p className="text-[10px] text-emerald-600">
                  An agent code will be auto-generated. The agent signs in with their code + this password.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={FIELD}>Role</label>
                <select className={INPUT} value={form.role} onChange={(e) => setF("role", e.target.value)}>
                  {assignableRoles.length > 0
                    ? assignableRoles.map((r) => <option key={r}>{r}</option>)
                    : ALL_DB_ROLES.map((r) => <option key={r}>{r}</option>)
                  }
                </select>
              </div>
              <div><label className={FIELD}>Status</label>
                <select className={INPUT} value={form.status} onChange={(e) => setF("status", e.target.value)}>
                  <option>Active</option><option>Inactive</option><option>Pending</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal({ open: false, mode: "add", data: null })}
                className="px-4 py-2 text-[12px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-dk-raised rounded-xl hover:bg-gray-200 dark:hover:bg-dk-stroke transition-all">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary-sm flex items-center gap-1.5">
                {saving && <Loader2 size={12} className="animate-spin" />}
                {modal.mode === "edit" ? "Save Changes" : "Add User"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete user?"
        message={`${confirmDelete.name} will be permanently removed and lose all dashboard access.`}
        onConfirm={() => { handleDelete(confirmDelete.id!); setConfirmDelete({ open: false, id: null, name: "" }); }}
        onCancel={() => setConfirmDelete({ open: false, id: null, name: "" })}
      />

    </div>
  );
}
