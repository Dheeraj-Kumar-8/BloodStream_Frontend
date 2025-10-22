import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createBloodBank, listBloodBanks } from '../../services/bloodbanks';
import { BloodBank } from '../../types';
import { useAuthStore } from '../../store/authStore';
import BloodBankMap from '../../components/BloodBankMap';

interface SearchFormValues {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  search?: string;
}

interface BloodBankFormValues {
  name: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

const BloodBanksPage = () => {
  const { user } = useAuthStore((state) => ({ user: state.user }));
  const [queryParams, setQueryParams] = useState<SearchFormValues>({ radiusKm: 50 });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['blood-banks', queryParams],
    queryFn: () => listBloodBanks(queryParams),
  });

  const createMutation = useMutation({
    mutationFn: createBloodBank,
    onSuccess: () => {
      void refetch();
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<SearchFormValues>({
    defaultValues: queryParams,
  });

  const {
    register: registerBank,
    handleSubmit: handleBankSubmit,
    reset: resetBankForm,
    formState: { isSubmitting: isBankSubmitting },
  } = useForm<BloodBankFormValues>({
    defaultValues: {
      name: '',
      contactNumber: '',
      email: '',
      address: '',
      latitude: undefined,
      longitude: undefined,
    },
  });

  const onSubmit = (values: SearchFormValues) => {
    const parsed = {
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
      radiusKm: values.radiusKm ? Number(values.radiusKm) : undefined,
      search: values.search?.trim() || undefined,
    };
    setQueryParams(parsed);
  };

  const onBankSubmit = async (values: BloodBankFormValues) => {
    await createMutation.mutateAsync({
      name: values.name,
      contactNumber: values.contactNumber,
      email: values.email,
      address: values.address,
      location: values.latitude && values.longitude ? { coordinates: [values.longitude, values.latitude] } : undefined,
      inventory: [],
    });
    resetBankForm();
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const roundedLat = Number(latitude.toFixed(5));
        const roundedLng = Number(longitude.toFixed(5));
        setValue('latitude', roundedLat);
        setValue('longitude', roundedLng);
        setQueryParams((prev) => ({
          ...prev,
          latitude: roundedLat,
          longitude: roundedLng,
        }));
        setLocationError(null);
        setIsLocating(false);
      },
      () => {
        setLocationError('Unable to access your location. Please allow permission or enter coordinates manually.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Blood bank directory</h1>
        <p className="text-sm text-slate-400">
          Discover nearby centers, check inventory, and keep contact info up to date.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-white">Search the network</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="latitude">
              Latitude
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('latitude')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="longitude">
              Longitude
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('longitude')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="radiusKm">
              Radius (km)
            </label>
            <input
              id="radiusKm"
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('radiusKm')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="search">
              Keyword
            </label>
            <input
              id="search"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('search')}
              placeholder="Hospital or city"
            />
          </div>
          <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              {locationError ?? 'Provide coordinates or use your current location to unlock nearby search.'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="rounded-lg border border-primary/50 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-60"
              >
                {isLocating ? 'Locating…' : 'Use my location'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/80 disabled:opacity-50"
              >
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {user?.role === 'admin' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white">Add a new blood bank</h2>
          <form onSubmit={handleBankSubmit(onBankSubmit)} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...registerBank('name', { required: true })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="contactNumber">
                Contact number
              </label>
              <input
                id="contactNumber"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...registerBank('contactNumber')}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...registerBank('email')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...registerBank('address')}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="latitude-bank">
                Latitude
              </label>
              <input
                id="latitude-bank"
                type="number"
                step="any"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...registerBank('latitude')}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="longitude-bank">
                Longitude
              </label>
              <input
                id="longitude-bank"
                type="number"
                step="any"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...registerBank('longitude')}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isBankSubmitting || createMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/80 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving…' : 'Save blood bank'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {isFetching && <div className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />}
        {!isFetching && data && data.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
            No blood banks found for this query.
          </div>
        )}
        {data?.map((bank: BloodBank) => (
          <article
            key={bank._id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg transition hover:border-primary/40"
          >
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{bank.name}</h3>
                <p className="text-sm text-slate-400">{bank.address ?? 'Address not provided'}</p>
              </div>
              <div className="text-right text-xs text-slate-400 space-y-1">
                <p>Phone: {bank.contactNumber ?? '—'}</p>
                <p>Email: {bank.email ?? '—'}</p>
                {bank.distanceKm !== undefined && (
                  <p className="text-emerald-300">{bank.distanceKm.toFixed(1)} km away</p>
                )}
              </div>
            </header>
            {bank.inventory.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {bank.inventory.map((item) => (
                  <div
                    key={`${bank._id}-${item.bloodType}`}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
                  >
                    <p className="text-xs uppercase text-slate-400">{item.bloodType}</p>
                    <p className="text-lg font-semibold text-white">{item.unitsAvailable}</p>
                    <p className="text-xs text-slate-500">
                      Updated {new Date(item.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <BloodBankMap
        banks={data ?? []}
        center={
          queryParams.latitude !== undefined && queryParams.longitude !== undefined
            ? { lat: Number(queryParams.latitude), lng: Number(queryParams.longitude) }
            : undefined
        }
        radiusKm={queryParams.radiusKm ?? 50}
      />
    </section>
  );
};

export default BloodBanksPage;
