import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
}: DataTablePaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  // 生成要显示的页码数组
  const getPageNumbers = () => {
    const pageNumbers = [];
    const showPages = 5; // 当前页前后显示的页码数

    // 始终添加第1页
    pageNumbers.push(1);

    // 计算显示范围
    let start = Math.max(2, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);

    // 调整范围以显示更多当前页附近的页码
    if (currentPage <= 3) {
      end = Math.min(totalPages - 1, showPages + 1);
    }
    if (currentPage >= totalPages - 2) {
      start = Math.max(2, totalPages - showPages);
    }

    // 添加省略号和页码
    if (start > 2) {
      pageNumbers.push("ellipsis1");
    }

    // 添加中间的页码
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    // 添加省略号
    if (end < totalPages - 1) {
      pageNumbers.push("ellipsis2");
    }

    // 始终添加最后一页
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-end gap-4 mt-4">
      <div className="text-sm text-muted-foreground shrink-0">
        共 {totalItems} 条记录
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              className={cn(
                "cursor-pointer",
                currentPage === 1 && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>

          {getPageNumbers().map((pageNumber, index) => (
            <PaginationItem key={index}>
              {pageNumber === "ellipsis1" || pageNumber === "ellipsis2" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(Number(pageNumber))}
                  isActive={currentPage === pageNumber}
                  className="cursor-pointer"
                >
                  {pageNumber}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              className={cn(
                "cursor-pointer",
                currentPage === totalPages && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
