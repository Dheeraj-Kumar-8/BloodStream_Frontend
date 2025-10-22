import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAppointment, listAppointments, updateAppointment } from '../../services/appointments';
import { Appointment } from '../../types';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

interface AppointmentFormValues {
  bloodBankId: string;
  scheduledAt: string;
  notes?: string;
}

const statusLabels: Record<Appointment['status'], string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

const AppointmentsPage = () => {
  const { user } = useAuthStore((state) => ({ user: state.user }));
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () =>
      listAppointments({ limit: 20, ...(user?.role === 'donor' ? { donorId: user._id } : {}) }),
  });

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] }).catch(console.error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string; status: Appointment['status'] }) =>
      updateAppointment(appointmentId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] }).catch(console.error);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AppointmentFormValues>({
    defaultValues: {
      bloodBankId: '',
      scheduledAt: new Date().toISOString().slice(0, 16),
      notes: '',
    },
  });

  const onSubmit = async (values: AppointmentFormValues) => {
    if (!user) return;
    await createMutation.mutateAsync({
      bloodBankId: values.bloodBankId,
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      notes: values.notes,
    });
    reset();
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Appointments</h1>
        <p className="text-sm text-slate-400">
          Schedule donation sessions and review the outcomes to stay donation-ready.
        </p>
      </header>

      {user?.role === 'donor' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white">Book your next donation</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="bloodBankId">
                Blood bank ID
              </label>
              <input
                id="bloodBankId"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('bloodBankId', { required: true })}
                placeholder="6430..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="scheduledAt">
                Scheduled time
              </label>
              <input
                id="scheduledAt"
                type="datetime-local"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('scheduledAt', { required: true })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('notes')}
                placeholder="Any recent health updates or preferences"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/80 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Booking…' : 'Book appointment'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-0 shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="px-4 py-3 font-medium">Blood bank</th>
                <th className="px-4 py-3 font-medium">Scheduled</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                {user?.role !== 'delivery' && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={user?.role !== 'delivery' ? 5 : 4} className="px-4 py-8 text-center text-slate-400">
                    Loading appointments…
                  </td>
                </tr>
              )}
              {!isLoading && data && data.items.length === 0 && (
                <tr>
                  <td colSpan={user?.role !== 'delivery' ? 5 : 4} className="px-4 py-8 text-center text-slate-400">
                    No appointments scheduled.
                  </td>
                </tr>
              )}
              {!isLoading &&
                data?.items.map((appointment: Appointment) => {
                  const bankName = typeof appointment.bloodBankId === 'object' && appointment.bloodBankId !== null
                    ? (appointment.bloodBankId as { name?: string }).name || 'Unknown Blood Bank'
                    : appointment.bloodBankId;
                  return (
                  <tr key={appointment._id} className="hover:bg-slate-900/80">
                    <td className="px-4 py-3 font-medium">{bankName}</td>
                    <td className="px-4 py-3">
                      {new Date(appointment.scheduledAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'rounded-full px-2 py-1 text-xs font-semibold uppercase',
                          appointment.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-200'
                            : appointment.status === 'scheduled'
                            ? 'bg-blue-500/20 text-blue-200'
                            : appointment.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-200'
                            : 'bg-yellow-500/20 text-yellow-200'
                        )}
                      >
                        {statusLabels[appointment.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{appointment.notes ?? '—'}</td>
                    {user?.role !== 'delivery' && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 text-xs">
                          {appointment.status === 'scheduled' && user?.role === 'donor' && (
                            <button
                              onClick={() => updateMutation.mutate({ appointmentId: appointment._id, status: 'cancelled' })}
                              className="rounded-lg border border-red-500/40 px-3 py-1 text-red-300 hover:bg-red-500/10"
                            >
                              Cancel
                            </button>
                          )}
                          {user?.role === 'admin' && (
                            <>
                              <button
                                onClick={() => updateMutation.mutate({ appointmentId: appointment._id, status: 'completed' })}
                                className="rounded-lg border border-emerald-500/40 px-3 py-1 text-emerald-200 hover:bg-emerald-500/10"
                              >
                                Mark completed
                              </button>
                              <button
                                onClick={() => updateMutation.mutate({ appointmentId: appointment._id, status: 'no_show' })}
                                className="rounded-lg border border-yellow-500/40 px-3 py-1 text-yellow-200 hover:bg-yellow-500/10"
                              >
                                Mark no-show
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default AppointmentsPage;
