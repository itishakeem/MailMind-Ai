"use client";

import { createContext, useContext } from "react";
import type { UserRole } from "@/types";

interface AdminCtx {
  userId: string;
  role: UserRole;
}

const AdminContext = createContext<AdminCtx>({ userId: "", role: "admin" });

export function useAdmin() {
  return useContext(AdminContext);
}

export function AdminProvider({
  userId,
  role,
  children,
}: AdminCtx & { children: React.ReactNode }) {
  return (
    <AdminContext.Provider value={{ userId, role }}>
      {children}
    </AdminContext.Provider>
  );
}
