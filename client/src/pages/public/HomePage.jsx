import { useState, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import CampaignCard from '../../components/ui/CampaignCard';
import { SkeletonCard } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import { useCampaigns } from '../../hooks';

const statuses = ['all', 'active', 'draft', 'completed', 'cancelled'];
const statusLabels = { all: 'All', active: 'Active', draft: 'Draft', completed: 'Completed', cancelled: 'Cancelled' };

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EmptyState = ({ search, status, onReset }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    </div>
    <h3 className="font-display font-bold text-slate-800 text-xl mb-2">No campaigns found</h3>
    <p className="text-slate-500 text-sm mb-6 max-w-xs">
      {search ? `No results for "${search}".` : `No ${status !== 'all' ? status : ''} campaigns available yet.`}
    </p>
    <Button variant="secondary" onClick={onReset}>Clear filters</Button>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
      <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="font-display font-bold text-slate-800 text-xl mb-2">Something went wrong</h3>
    <p className="text-slate-500 text-sm mb-6">{message}</p>
    <Button variant="secondary" onClick={onRetry}>Try again</Button>
  </div>
);

const Pagination = ({ pagination, onPage }) => {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-10">
      <p className="text-sm text-slate-500">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong> · {total} campaigns
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ← Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next →
        </Button>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [searchInput, setSearchInput] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');

  const { campaigns, pagination, loading, error, params, updateParams, goToPage, refetch } = useCampaigns({ limit: 12 });

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    updateParams({ search: searchInput || undefined, status: activeStatus !== 'all' ? activeStatus : undefined });
  }, [searchInput, activeStatus, updateParams]);

  const handleStatusFilter = useCallback((status) => {
    setActiveStatus(status);
    updateParams({ status: status !== 'all' ? status : undefined, search: searchInput || undefined });
  }, [searchInput, updateParams]);

  const handleReset = () => {
    setSearchInput('');
    setActiveStatus('all');
    updateParams({ search: undefined, status: undefined });
  };

  return (
    <Layout>
      {/* Hero header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Community Impact Platform
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-4">
              Join a campaign,<br />change a life.
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              Discover active solidarity campaigns in your area and sign up to volunteer. Every action counts.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search & Filters toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search campaigns by title, description or location…"
                className="input-field pl-10"
              />
            </div>
            <Button type="submit" variant="primary">Search</Button>
          </form>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-1">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeStatus === status
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && !error && campaigns.length > 0 && (
          <p className="text-sm text-slate-500 mb-6">
            Showing <strong className="text-slate-700">{campaigns.length}</strong> of{' '}
            <strong className="text-slate-700">{pagination.total}</strong> campaigns
          </p>
        )}

        {/* Campaign grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : campaigns.length === 0 ? (
            <EmptyState search={params.search} status={activeStatus} onReset={handleReset} />
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="animate-fade-in">
                <CampaignCard campaign={campaign} />
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && <Pagination pagination={pagination} onPage={goToPage} />}
      </div>
    </Layout>
  );
};

export default HomePage;
