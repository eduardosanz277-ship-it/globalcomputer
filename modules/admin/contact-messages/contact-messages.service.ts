import { repoListContactMessagesAdmin } from "./contact-messages.repository";
import type { ContactMessageAdmin } from "./contact-messages.types";

export async function listContactMessagesAdminService(): Promise<
  ContactMessageAdmin[]
> {
  return repoListContactMessagesAdmin();
}
