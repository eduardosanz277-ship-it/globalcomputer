import Image from "next/image";

type Props = {
  imageUrl: string;
  imageAlt: string;
};

export function DefaultServiceBanner({ imageUrl, imageAlt }: Props) {
  return (
    <section className="relative w-full overflow-hidden border-y border-border/40 bg-black/90">
      <div className="relative h-[46vh] min-h-[17rem] w-full sm:h-[56vh] lg:h-[64vh]">
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-40 blur-sm"
          priority
        />
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
      </div>
    </section>
  );
}
