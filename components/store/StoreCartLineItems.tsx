"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreQuantityStepper } from "@/components/store/StoreQuantityStepper";
import {
  gcCartRemoveProduct,
  gcCartSetQty,
  type GcCartItem,
} from "@/lib/store-cart";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import { storefrontPrimaryImageUrl } from "@/modules/catalog/storefront-product.shared";
import { cn } from "@/utils/cn";
import { formatUsd } from "@/components/store/store-cart-format";
import { cartLineUnitPrice } from "@/components/store/cart-line-price";

function CartLineSkeleton({ dense }: { dense?: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-border/50 bg-card/80 p-3",
        dense && "p-2.5",
      )}
    >
      <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-muted md:h-24 md:w-24" />
      <div className="min-w-0 flex-1 space-y-2 py-0.5">
        <div className="h-4 w-56 max-w-[85%] animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

function CartLineRow({
  item,
  product,
  tier,
  dense,
}: {
  item: GcCartItem;
  product: StorefrontProduct | undefined;
  tier: StorefrontPriceTier;
  dense?: boolean;
}) {
  if (!product) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-sm",
          dense && "py-2.5",
        )}
      >
        <p className="text-muted-foreground">
          Un producto de tu carrito ya no está disponible.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => gcCartRemoveProduct(item.productId)}
        >
          Quitar
        </Button>
      </div>
    );
  }

  const img = storefrontPrimaryImageUrl(product);
  const unit = cartLineUnitPrice(product, tier);
  const lineTotal = unit * item.qty;
  const maxQty = Math.max(0, product.stock);
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-border/50 bg-card p-3 shadow-soft transition hover:border-border",
        dense && "p-2.5",
      )}
    >
      <Link
        href={`/productos/${product.id}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted/50 ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:h-24 md:w-24"
      >
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            Sin foto
          </div>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/productos/${product.id}`}
              className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-primary"
            >
              {product.name}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {product.brand_name}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label="Eliminar del carrito"
            onClick={() => gcCartRemoveProduct(product.id)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <StoreQuantityStepper
            value={item.qty}
            max={maxQty}
            className="h-10 rounded-lg border-border/80 bg-white shadow-none dark:bg-white [&>button]:w-8 [&>button_svg]:h-4 [&>button_svg]:w-4 [&>span]:min-w-[2rem] [&>span]:px-1 [&>span]:text-sm"
            allowDecrementAtMin
            onDecrementAtMin={() => gcCartRemoveProduct(product.id)}
            onChange={(nextQty) => gcCartSetQty(product.id, nextQty, product.stock)}
          />
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-muted-foreground">
              {formatUsd(unit)} c/u
            </span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              {formatUsd(lineTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoreCartLineItems({
  items,
  productsById,
  loading,
  tier,
  dense,
}: {
  items: GcCartItem[];
  productsById: Record<string, StorefrontProduct>;
  loading: boolean;
  tier: StorefrontPriceTier;
  dense?: boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <>
        <CartLineSkeleton dense={dense} />
        <CartLineSkeleton dense={dense} />
      </>
    );
  }

  const linesNewestFirst = [...items].reverse();

  return (
    <>
      {linesNewestFirst.map((line) => (
        <CartLineRow
          key={line.productId}
          item={line}
          product={productsById[line.productId]}
          tier={tier}
          dense={dense}
        />
      ))}
    </>
  );
}
