import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-zinc-100', className)}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center space-x-4 py-3 px-4 border-b border-zinc-100">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/5" />
      <Skeleton className="h-4 w-1/6" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-4 w-1/6" />
    </div>
  )
}
