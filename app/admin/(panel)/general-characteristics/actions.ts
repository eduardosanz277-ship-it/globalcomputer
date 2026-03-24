"use server";

import {
  createGeneralCharacteristicService,
  deleteGeneralCharacteristicService,
  updateGeneralCharacteristicService,
} from "@/modules/admin/general-characteristics/general-characteristics.service";
import type {
  GeneralCharacteristicInsert,
  GeneralCharacteristicUpdate,
} from "@/modules/admin/general-characteristics/general-characteristics.types";

export async function createGeneralCharacteristicAction(
  values: GeneralCharacteristicInsert
) {
  await createGeneralCharacteristicService(values);
}

export async function updateGeneralCharacteristicAction(
  id: string,
  values: GeneralCharacteristicUpdate
) {
  await updateGeneralCharacteristicService(id, values);
}

export async function deleteGeneralCharacteristicAction(id: string) {
  await deleteGeneralCharacteristicService(id);
}
