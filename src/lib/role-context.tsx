"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "@/lib/mock-data";

const STORAGE_KEY = "gifting-ops-role";

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue>({
  role: "ADMIN",
  setRole: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("ADMIN");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Role | null;
    if (stored) setRoleState(stored);
    setHydrated(true);
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem(STORAGE_KEY, newRole);
  };

  // Avoid hydration mismatch — render nothing until we know the role
  if (!hydrated) return null;

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  return useContext(RoleContext);
}
