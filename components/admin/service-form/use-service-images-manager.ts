"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ExistingServiceImageInput,
  ExistingServiceImageOutput,
  NewServiceImageOutput,
  ServiceImageItem,
} from "./types";

function normalizeOrder(items: ServiceImageItem[]): ServiceImageItem[] {
  return items.map((item, idx) => ({ ...item, order: idx }));
}

export function useServiceImagesManager(existingImages: ExistingServiceImageInput[]) {
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const createdObjectUrlsRef = useRef<string[]>([]);

  const [items, setItems] = useState<ServiceImageItem[]>(() => {
    const sorted = [...existingImages].sort((a, b) => a.order - b.order);
    return normalizeOrder(
      sorted.map((img, idx) => ({
        key: `existing:${img.id}`,
        source: "existing" as const,
        existingId: img.id,
        url: img.url,
        order: idx,
        isPrimary: img.isPrimary,
      }))
    );
  });

  useEffect(() => {
    return () => {
      createdObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      createdObjectUrlsRef.current = [];
    };
  }, []);

  const ensureSinglePrimary = (nextItems: ServiceImageItem[]) => {
    if (nextItems.length === 0) return nextItems;
    const primaryIndex = nextItems.findIndex((i) => i.isPrimary);
    if (primaryIndex >= 0) return nextItems;
    return nextItems.map((item, idx) => ({ ...item, isPrimary: idx === 0 }));
  };

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    setItems((prev) => {
      const appended = files.map((file, idx) => {
        const objectUrl = URL.createObjectURL(file);
        createdObjectUrlsRef.current.push(objectUrl);
        return {
          key: `new:${crypto.randomUUID()}`,
          source: "new" as const,
          file,
          url: objectUrl,
          order: prev.length + idx,
          isPrimary: false,
        };
      });
      return normalizeOrder(ensureSinglePrimary([...prev, ...appended]));
    });
  };

  const removeImage = (key: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.key === key);
      if (!target) return prev;

      if (target.source === "existing" && target.existingId) {
        setRemovedImages((old) =>
          old.includes(target.existingId!) ? old : [...old, target.existingId!]
        );
      }

      const next = prev.filter((item) => item.key !== key);
      return normalizeOrder(ensureSinglePrimary(next));
    });
  };

  const markPrimary = (key: string) => {
    setItems((prev) =>
      prev.map((item) => ({ ...item, isPrimary: item.key === key }))
    );
  };

  const moveImage = (activeKey: string, overKey: string) => {
    if (activeKey === overKey) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.key === activeKey);
      const newIndex = prev.findIndex((i) => i.key === overKey);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      return normalizeOrder(next);
    });
  };

  const moveByKeyboard = (key: string, direction: "up" | "down") => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      if (idx < 0) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return normalizeOrder(next);
    });
  };

  const newImages = useMemo<NewServiceImageOutput[]>(() => {
    return items
      .filter((item) => item.source === "new" && item.file)
      .map((item) => ({
        file: item.file as File,
        order: item.order,
        isPrimary: item.isPrimary,
      }));
  }, [items]);

  const updatedExistingImages = useMemo<ExistingServiceImageOutput[]>(() => {
    return items
      .filter((item) => item.source === "existing" && item.existingId)
      .map((item) => ({
        id: item.existingId as string,
        order: item.order,
        isPrimary: item.isPrimary,
      }));
  }, [items]);

  return {
    items,
    removedImages,
    addFiles,
    removeImage,
    markPrimary,
    moveImage,
    moveByKeyboard,
    newImages,
    updatedExistingImages,
  };
}
