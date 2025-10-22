import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listDeliveries,
  createDelivery,
  updateDeliveryStatus,
  addTrackingEvent,
} from '../../services/deliveries';
import { Delivery } from '../../types';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

interface DeliveryFormValues {
  requestId: string;
  donorId?: string;
  deliveryPersonId: string;
  pickupEta?: string;
  dropoffEta?: string;
}

interface TrackingFormValues {
  status: string;
  notes?: string;
}

const statusOptions = [
  { value: 'pending_pickup', label: 'Pending pickup' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DeliveriesPage = () => {
  const { user } = useAuthStore((state) => ({ user: state.user }));
  const queryClient = useQueryClient();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCreate = user?.role === 'admin';
  const canUpdateStatus = user?.role === 'delivery' || user?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => listDeliveries({ limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: createDelivery,
    onSuccess: (created: Delivery) => {
      setMessage(`Delivery created for request ${created.requestId._id}.`);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['deliveries'] }).catch(console.error);
    },
    onError: () => {
      setError('Unable to create the delivery. Double-check the request and driver IDs.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      deliveryId,
      status,
      pickupEta,
      dropoffEta,
    }: {
      deliveryId: string;
      status: string;
      pickupEta?: string;
      dropoffEta?: string;
    }) => updateDeliveryStatus(deliveryId, { status, pickupEta, dropoffEta }),
    onSuccess: (delivery: Delivery) => {
      setMessage(`Status updated to ${delivery.status}.`);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['deliveries'] }).catch(console.error);
    },
    onError: () => {
      setError('Unable to update delivery status right now.');
    },
  });

  const trackingMutation = useMutation({
    mutationFn: ({
      deliveryId,
      status,
      notes,
    }: {
      deliveryId: string;
      status: string;
      notes?: string;
    }) => addTrackingEvent(deliveryId, { status, notes }),
    onSuccess: (delivery: Delivery) => {
      setMessage('Tracking event recorded.');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['deliveries'] }).catch(console.error);
      setSelectedDelivery(delivery);
    },
    onError: () => {
      setError('Unable to add tracking event.');
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<DeliveryFormValues>({
    defaultValues: {
      requestId: '',
      donorId: '',
      deliveryPersonId: '',
      pickupEta: '',
      dropoffEta: '',
    },
  });

  const {
    register: registerTracking,
    handleSubmit: handleTrackingSubmit,
    reset: resetTracking,
    formState: { isSubmitting: isTrackingSubmitting },
  } = useForm<TrackingFormValues>({
    defaultValues: {
      status: 'in_transit',
      notes: '',
    },
  });

  const onSubmit = async (values: DeliveryFormValues) => {
    setMessage(null);
    setError(null);
    await createMutation.mutateAsync({
      requestId: values.requestId,
      donorId: values.donorId || undefined,
      deliveryPersonId: values.deliveryPersonId,
      pickupEta: values.pickupEta || undefined,
      dropoffEta: values.dropoffEta || undefined,
    });
    reset();
  };

  const onTrackingSubmit = async (values: TrackingFormValues) => {
    if (!selectedDelivery) return;
    await trackingMutation.mutateAsync({
      deliveryId: selectedDelivery._id,
      status: values.status,
      notes: values.notes || undefined,
    });
    resetTracking();
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Delivery operations</h1>
          <p className="text-sm text-slate-400">
            Assign couriers, monitor hand-offs, and keep an eye on every unit in transit.
          </p>
        </div>
      </header>

      {canCreate && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white">Schedule a new delivery</h2>
          <p className="text-sm text-slate-400">
            Provide the request, donor, and courier IDs to coordinate transport.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="requestId">
                Request ID
              </label>
              <input
                id="requestId"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('requestId', { required: true })}
                placeholder="642f..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="donorId">
                Donor ID (optional)
              </label>
              <input
                id="donorId"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('donorId')}
                placeholder="642f..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="deliveryPersonId">
                Courier user ID
              </label>
              <input
                id="deliveryPersonId"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('deliveryPersonId', { required: true })}
                placeholder="642f..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="pickupEta">
                Pickup ETA (ISO date)
              </label>
              <input
                id="pickupEta"
                type="datetime-local"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('pickupEta')}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="dropoffEta">
                Drop-off ETA (ISO date)
              </label>
              <input
                id="dropoffEta"
                type="datetime-local"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('dropoffEta')}
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/80 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Scheduling…' : 'Schedule delivery'}
              </button>
            </div>
          </form>
        </div>
      )}

      {(message || error) && (
        <div
          className={clsx(
            'rounded-xl border px-4 py-3 text-sm',
            error
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          )}
        >
          {error ?? message}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-0 shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="px-4 py-3 font-medium">Request</th>
                <th className="px-4 py-3 font-medium">Courier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Pickup ETA</th>
                <th className="px-4 py-3 font-medium">Drop-off ETA</th>
                <th className="px-4 py-3 font-medium">Updates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading deliveries…
                  </td>
                </tr>
              )}
              {!isLoading && data && data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No deliveries scheduled yet.
                  </td>
                </tr>
              )}
              {!isLoading &&
                data?.items.map((delivery: Delivery) => {
                  const requestIdDisplay = typeof delivery.requestId === 'object' && delivery.requestId !== null
                    ? (delivery.requestId as { _id?: string })._id || 'Unknown'
                    : delivery.requestId;
                  const deliveryPersonName = typeof delivery.deliveryPersonId === 'object' && delivery.deliveryPersonId !== null
                    ? (delivery.deliveryPersonId as { firstName?: string }).firstName || 'Unassigned'
                    : delivery.deliveryPersonId ? 'Assigned' : 'Unassigned';
                  return (
                  <tr key={delivery._id} className="hover:bg-slate-900/80">
                    <td className="px-4 py-3 font-medium">{requestIdDisplay}</td>
                    <td className="px-4 py-3">{deliveryPersonName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'rounded-full px-2 py-1 text-xs font-semibold uppercase',
                          delivery.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-200'
                            : delivery.status === 'in_transit'
                            ? 'bg-blue-500/20 text-blue-200'
                            : delivery.status === 'pending_pickup'
                            ? 'bg-yellow-500/20 text-yellow-200'
                            : 'bg-red-500/20 text-red-200'
                        )}
                      >
                        {delivery.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {delivery.pickupEta ? new Date(delivery.pickupEta).toLocaleString() : 'n/a'}
                    </td>
                    <td className="px-4 py-3">
                      {delivery.dropoffEta ? new Date(delivery.dropoffEta).toLocaleString() : 'n/a'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedDelivery(delivery)}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          View
                        </button>
                        {canUpdateStatus && (
                          <>
                            <button
                              onClick={() =>
                                statusMutation.mutate({ deliveryId: delivery._id, status: 'in_transit' })
                              }
                              className="rounded-lg border border-blue-500/40 px-3 py-1 text-xs text-blue-300 hover:bg-blue-500/10"
                            >
                              Mark in transit
                            </button>
                            <button
                              onClick={() => statusMutation.mutate({ deliveryId: delivery._id, status: 'delivered' })}
                              className="rounded-lg border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/10"
                            >
                              Mark delivered
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDelivery && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Delivery timeline</h2>
              <p className="text-sm text-slate-400">Keep the team in sync with fresh tracking updates.</p>
            </div>
            <button
              onClick={() => setSelectedDelivery(null)}
              className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </header>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              {selectedDelivery.tracking.length === 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
                  No tracking events yet.
                </div>
              )}
              {selectedDelivery.tracking.map((event) => (
                <article
                  key={event.timestamp}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">{event.status}</span>
                    <span className="text-slate-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {event.notes && <p className="mt-2 text-sm text-slate-300">{event.notes}</p>}
                </article>
              ))}
            </div>
            {canUpdateStatus && (
              <form
                onSubmit={handleTrackingSubmit(onTrackingSubmit)}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <h3 className="text-sm font-semibold text-slate-300">Add tracking event</h3>
                <label className="mt-3 block text-sm font-medium text-slate-300" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  {...registerTracking('status', { required: true })}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <label className="mt-3 block text-sm font-medium text-slate-300" htmlFor="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  {...registerTracking('notes')}
                  placeholder="Provide useful context for dispatch"
                />
                <button
                  type="submit"
                  disabled={isTrackingSubmitting || trackingMutation.isPending}
                  className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/80 disabled:opacity-50"
                >
                  {trackingMutation.isPending ? 'Saving…' : 'Record event'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default DeliveriesPage;
