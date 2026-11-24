import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  /** e.g. "registros", "usuários" */
  itemLabel: string;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, total, itemLabel, onPageChange }) => (
  <div className="flex items-center justify-between gap-3 pt-4">
    <span className="text-xs text-slate-500">
      {total} {itemLabel} · página {page} de {totalPages}
    </span>
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        leftIcon={<ChevronLeft className="w-4 h-4" />}
      >
        Anterior
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        rightIcon={<ChevronRight className="w-4 h-4" />}
      >
        Próxima
      </Button>
    </div>
  </div>
);
