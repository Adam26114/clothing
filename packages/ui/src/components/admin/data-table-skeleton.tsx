import { cn } from '@workspace/ui/lib/utils';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';

interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
  className?: string;
}

export function DataTableSkeleton({
  columnCount = 6,
  rowCount = 10,
  className,
}: DataTableSkeletonProps) {
  return (
    <div className={cn('border-border overflow-hidden rounded-lg border', className)}>
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            {Array.from({ length: columnCount }).map((_, index) => (
              <TableHead key={`sk-head-${index}`}>
                <Skeleton className="h-4 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={`sk-row-${rowIndex}`}>
              {Array.from({ length: columnCount }).map((__, colIndex) => (
                <TableCell key={`sk-row-${rowIndex}-cell-${colIndex}`}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
