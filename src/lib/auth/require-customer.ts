import { getCustomerSession, type CustomerSession } from "@/lib/auth/session";

export async function requireCustomer(): Promise<
  { session: CustomerSession; error: null } | { session: null; error: string; status: 401 }
> {
  const session = await getCustomerSession();
  if (!session) {
    return { session: null, error: "Please log in to continue", status: 401 };
  }
  return { session, error: null };
}
