import Link from "next/link";

export default function WalletPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Wallet</h1>
        <Link href="/profile" className="inline-flex h-9 items-center rounded-md border px-4 text-sm">
          Profile
        </Link>
      </div>
      <p className="text-muted-foreground">Scan your first QR — full wallet coming Day 4.</p>
    </div>
  );
}
