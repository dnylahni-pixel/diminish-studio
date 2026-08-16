'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { FilterIcon, XIcon } from 'lucide-react';

export function UsersFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.set('page', '1'); // Reset page on filter change
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (key: string, value: string) => {
    router.push(`${pathname}?${createQueryString(key, value)}`);
  };

  const hasFilters = searchParams.get('subscription') || searchParams.get('plan') || searchParams.get('from');

  const clearFilters = () => {
    router.push(pathname);
  };

  const FilterControls = () => (
    <>
      <Select
        placeholder="Subscription Status"
        value={searchParams.get('subscription') || ''}
        onChange={(val) => handleFilterChange('subscription', val)}
        options={[
          { label: 'All', value: '' },
          { label: 'Active', value: 'active' },
          { label: 'Canceled', value: 'canceled' },
          { label: 'None', value: 'none' },
        ]}
      />
      <Select
        placeholder="Plan"
        value={searchParams.get('plan') || ''}
        onChange={(val) => handleFilterChange('plan', val)}
        options={[
          { label: 'All', value: '' },
          { label: 'Basic', value: 'Basic' },
          { label: 'Pro', value: 'Pro' },
          { label: 'Enterprise', value: 'Enterprise' },
        ]}
      />
      <DateRangePicker
        from={searchParams.get('from') || undefined}
        to={searchParams.get('to') || undefined}
        onChange={(range) => {
          const params = new URLSearchParams(searchParams.toString());
          if (range?.from) params.set('from', range.from.toISOString());
          else params.delete('from');
          if (range?.to) params.set('to', range.to.toISOString());
          else params.delete('to');
          params.set('page', '1');
          router.push(`${pathname}?${params.toString()}`);
        }}
      />
      {hasFilters && (
        <Button variant="ghost" onClick={clearFilters} className="text-sm">
          Clear Filters
        </Button>
      )}
    </>
  );

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex-1 max-w-sm">
        <SearchInput 
          placeholder="Search ID, email, or username..." 
          defaultValue={searchParams.get('q') || ''}
          onSearch={(val) => handleFilterChange('q', val)}
        />
      </div>
      
      {/* Desktop Filters */}
      <div className="hidden md:flex items-center gap-2">
        <FilterControls />
      </div>

      {/* Mobile Filters */}
      <div className="md:hidden">
        <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>
          <FilterIcon className="w-4 h-4 mr-2" /> Filters
        </Button>
        <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Filters">
          <div className="flex flex-col gap-4 p-4">
            <FilterControls />
          </div>
        </Drawer>
      </div>
    </div>
  );
}
