"use server";

import {
  createSpecificCharacteristicService,
  deleteSpecificCharacteristicService,
  updateSpecificCharacteristicService,
} from "@/modules/admin/specific-characteristics/specific-characteristics.service";
import type {
  SpecificCharacteristicInsert,
  SpecificCharacteristicUpdate,
} from "@/modules/admin/specific-characteristics/specific-characteristics.types";

export async function createSpecificCharacteristicAction(
  values: SpecificCharacteristicInsert
) {
  await createSpecificCharacteristicService(values);
}

export async function updateSpecificCharacteristicAction(
  id: string,
  values: SpecificCharacteristicUpdate
) {
  await updateSpecificCharacteristicService(id, values);
}

export async function deleteSpecificCharacteristicAction(id: string) {
  await deleteSpecificCharacteristicService(id);
}
