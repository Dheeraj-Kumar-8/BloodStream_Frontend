import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRequest,
  listRequests,
  matchDonors,
  escalateEmergency,
  acceptRequest,
  declineRequest,
} from '../../services/requests';
import { BloodRequest } from '../../types';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

interface RequestFormValues {
  bloodType: string;
  unitsNeeded: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  hospitalName?: string;
  hospitalAddress?: string;
  notes?: string;
}

const urgencyOptions: Array<{ value: RequestFormValues['urgency']; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const RequestsPage = () => {
  const { user } = useAuthStore((state) => ({ user: state.user }));
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isRecipientFacing = user?.role === 'recipient' || user?.role === 'admin';
  const canCoordinate = user?.role === 'admin';
  const isDonor = user?.role === 'donor';

  const { data, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: () => listRequests({ limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: createRequest,
  onSuccess: (created: BloodRequest) => {
      setInfo(`Request created successfully (ID ${created._id}). Matching donors now.`);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['requests'] }).catch(console.error);
    },
    onError: () => {
      setError('Unable to create the request. Please review your information and try again.');
    },
  });

  const matchMutation = useMutation({
    mutationFn: matchDonors,
    onSuccess: (updated: BloodRequest) => {
      setInfo('Donor matching triggered. We will notify donors immediately.');
      setError(null);
      setSelectedRequest(updated);
      queryClient.invalidateQueries({ queryKey: ['requests'] }).catch(console.error);
    },
    onError: () => {
      setError('Unable to match donors right now. Try again soon.');
    },
  });

  const escalateMutation = useMutation({
    mutationFn: escalateEmergency,
    onSuccess: (updated: BloodRequest) => {
      setInfo('Emergency escalation dispatched to all nearby donors and coordinators.');
      setError(null);
      setSelectedRequest(updated);
      queryClient.invalidateQueries({ queryKey: ['requests'] }).catch(console.error);
    },
    onError: () => {
      setError('Escalation failed. Please coordinate manually and retry.');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptRequest,
    onSuccess: (updated: BloodRequest) => {
      setInfo('Thanks for stepping up! Logistics will connect with you shortly.');
      setError(null);
      setSelectedRequest(updated);
      queryClient.invalidateQueries({ queryKey: ['requests'] }).catch(console.error);
    },
    onError: () => {
      setError('Unable to accept the request. It may have been fulfilled already.');
    },
  });

  const declineMutation = useMutation({
    mutationFn: declineRequest,
    onSuccess: (updated: BloodRequest) => {
      setInfo('No worries—we notified the team to keep searching.');
      setError(null);
      setSelectedRequest(updated);
      queryClient.invalidateQueries({ queryKey: ['requests'] }).catch(console.error);
    },
    onError: () => {
      setError('Unable to update your response. Try again shortly.');
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<RequestFormValues>({
    defaultValues: {
      bloodType: user?.bloodType ?? 'O+',
      unitsNeeded: 1,
      urgency: 'high',
      hospitalName: '',
      hospitalAddress: '',
      notes: '',
    },
  });

  const onSubmit = async (values: RequestFormValues) => {
    setError(null);
    setInfo(null);
    await createMutation.mutateAsync({
      bloodType: values.bloodType,
      unitsNeeded: Number(values.unitsNeeded),
      urgency: values.urgency,
      hospital: {
        name: values.hospitalName,
        address: values.hospitalAddress,
      },
      notes: values.notes,
    });
    reset();
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Blood requests</h1>
          <p className="text-sm text-slate-400">
            Coordinate donor responses, track emergencies, and monitor request fulfillment.
          </p>
        </div>
        {isRecipientFacing && (
          <button
            onClick={() => setSelectedRequest(null)}
            className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            New request
          </button>
        )}
      </header>

      {isRecipientFacing && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white">Raise a new blood request</h2>
          <p className="text-sm text-slate-400">
            Provide the critical details to alert compatible donors instantly.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="bloodType">
                Blood type
              </label>
              <select
                id="bloodType"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('bloodType', { required: true })}
              >
                {bloodTypes.map((bloodType) => (
                  <option key={bloodType} value={bloodType}>
                    {bloodType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="unitsNeeded">
                Units needed
              </label>
              <input
                id="unitsNeeded"
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('unitsNeeded', { required: true, min: 1 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="urgency">
                Urgency level
              </label>
              <select
                id="urgency"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('urgency', { required: true })}
              >
                {urgencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="hospitalName">
                Hospital / clinic name
              </label>
              <input
                id="hospitalName"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('hospitalName')}
                placeholder="City Medical Center"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="hospitalAddress">
                Location details
              </label>
              <textarea
                id="hospitalAddress"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                rows={2}
                {...register('hospitalAddress')}
                placeholder="123 Main St, Springfield"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="notes">
                Notes for coordinators
              </label>
              <textarea
                id="notes"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                rows={2}
                {...register('notes')}
                placeholder="Any special handling instructions or time constraints"
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                We&apos;ll automatically contact compatible donors within a 50km radius.
              </div>
              <button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/80 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {(error || info) && (
        <div
          className={clsx(
            'rounded-xl border px-4 py-3 text-sm',
            error
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          )}
        >
          {error ?? info}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-0 shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="px-4 py-3 font-medium">Blood type</th>
                <th className="px-4 py-3 font-medium">Units</th>
                <th className="px-4 py-3 font-medium">Urgency</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Matches</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading requests…
                  </td>
                </tr>
              )}
              {!isLoading && data && data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No requests yet. {isRecipientFacing ? 'Create one above to get started.' : 'Check back soon!'}
                  </td>
                </tr>
              )}
              {!isLoading &&
                data?.items.map((request: BloodRequest) => (
                  <tr key={request._id} className="hover:bg-slate-900/80">
                    <td className="px-4 py-3 font-medium">{request.bloodType}</td>
                    <td className="px-4 py-3">{request.unitsNeeded}</td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'rounded-full px-2 py-1 text-xs font-semibold uppercase',
                          request.urgency === 'critical'
                            ? 'bg-red-500/20 text-red-200'
                            : request.urgency === 'high'
                            ? 'bg-orange-500/20 text-orange-200'
                            : request.urgency === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-200'
                            : 'bg-emerald-500/20 text-emerald-200'
                        )}
                      >
                        {request.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">{request.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{request.matches.length}</td>
                    <td className="px-4 py-3">
                      {new Date(request.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-slate-300 hover:bg-slate-800"
                        >
                          View
                        </button>
                        {canCoordinate && (
                          <>
                            <button
                              onClick={() => matchMutation.mutate(request._id)}
                              className="rounded-lg border border-primary/40 px-3 py-1 text-primary hover:bg-primary/10"
                            >
                              Match donors
                            </button>
                            <button
                              onClick={() => escalateMutation.mutate(request._id)}
                              className="rounded-lg border border-red-500/40 px-3 py-1 text-red-300 hover:bg-red-500/10"
                            >
                              Escalate
                            </button>
                          </>
                        )}
                        {isDonor &&
                          (request.status === 'pending' || request.status === 'matched') && (
                            <>
                              <button
                                onClick={() => acceptMutation.mutate(request._id)}
                                className="rounded-lg border border-emerald-500/40 px-3 py-1 text-emerald-200 hover:bg-emerald-500/10"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => declineMutation.mutate(request._id)}
                                className="rounded-lg border border-red-500/40 px-3 py-1 text-red-300 hover:bg-red-500/10"
                              >
                                Decline
                              </button>
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Request details</h2>
              <p className="text-sm text-slate-400">Drill into matches and responses.</p>
            </div>
            <button
              onClick={() => setSelectedRequest(null)}
              className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </header>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold text-slate-300">Summary</h3>
              <dl className="mt-3 space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <dt>Blood type</dt>
                  <dd className="font-medium text-white">{selectedRequest.bloodType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Units needed</dt>
                  <dd className="font-medium text-white">{selectedRequest.unitsNeeded}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Urgency</dt>
                  <dd className="font-medium capitalize text-white">
                    {selectedRequest.urgency.replace('_', ' ')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Status</dt>
                  <dd className="font-medium capitalize text-white">
                    {selectedRequest.status.replace('_', ' ')}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold text-slate-300">Notes</h3>
              <p className="mt-2 text-sm text-slate-300">
                {selectedRequest.notes ?? 'No additional notes provided.'}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-300">Potential matches</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="px-3 py-2 font-medium">Donor</th>
                    <th className="px-3 py-2 font-medium">Score</th>
                    <th className="px-3 py-2 font-medium">Distance</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {selectedRequest.matches.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                        No matches yet. Trigger donor matching to begin outreach.
                      </td>
                    </tr>
                  )}
                  {selectedRequest.matches.map((match) => (
                    <tr key={match.donorId._id}>
                      <td className="px-3 py-3">
                        {match.donorId.firstName} {match.donorId.lastName}
                      </td>
                      <td className="px-3 py-3">{Math.round(match.compatibilityScore * 100)}%</td>
                      <td className="px-3 py-3">
                        {match.distanceKm ? `${match.distanceKm.toFixed(1)} km` : 'n/a'}
                      </td>
                      <td className="px-3 py-3 capitalize">{match.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RequestsPage;
