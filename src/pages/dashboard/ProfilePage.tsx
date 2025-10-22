import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { getHealthMetrics, addHealthMetric } from '../../services/users';
import clsx from 'clsx';

interface ProfileFormValues {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bloodType?: string;
  notificationPreferences?: {
    emergencyAlerts: boolean;
    emailUpdates: boolean;
    smsUpdates: boolean;
  };
}

interface HealthMetricFormValues {
  hemoglobin?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulse?: number;
  weight?: number;
  notes?: string;
}

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { user, updateProfile } = useAuthStore((state) => ({
    user: state.user,
    updateProfile: state.updateProfile,
  }));

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      firstName: user?.firstName,
      lastName: user?.lastName,
      phoneNumber: user?.phoneNumber,
      bloodType: user?.bloodType,
      notificationPreferences: {
        emergencyAlerts: user?.notificationPreferences?.emergencyAlerts ?? true,
        emailUpdates: user?.notificationPreferences?.emailUpdates ?? true,
        smsUpdates: user?.notificationPreferences?.smsUpdates ?? true,
      },
    },
  });

  useEffect(() => {
    reset({
      firstName: user?.firstName,
      lastName: user?.lastName,
      phoneNumber: user?.phoneNumber,
      bloodType: user?.bloodType,
      notificationPreferences: {
        emergencyAlerts: user?.notificationPreferences?.emergencyAlerts ?? true,
        emailUpdates: user?.notificationPreferences?.emailUpdates ?? true,
        smsUpdates: user?.notificationPreferences?.smsUpdates ?? true,
      },
    });
  }, [user, reset]);

  const healthMetricsQuery = useQuery({
    queryKey: ['health-metrics'],
    queryFn: () => getHealthMetrics({ limit: 20 }),
    enabled: user?.role === 'donor',
  });

  const healthMetrics = (healthMetricsQuery.data ?? []) as Awaited<ReturnType<typeof getHealthMetrics>>;

  const healthMetricMutation = useMutation({
    mutationFn: addHealthMetric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-metrics'] }).catch(console.error);
    },
  });

  const {
    register: registerHealth,
    handleSubmit: handleHealthSubmit,
    reset: resetHealth,
    formState: { isSubmitting: isSavingHealth },
  } = useForm<HealthMetricFormValues>({
    defaultValues: {
      hemoglobin: undefined,
      bloodPressureSystolic: undefined,
      bloodPressureDiastolic: undefined,
      pulse: undefined,
      weight: undefined,
      notes: '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setStatusMessage(null);
    setError(null);
    try {
      await updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber,
        bloodType: values.bloodType,
        notificationPreferences: values.notificationPreferences,
      });
      setStatusMessage('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      setError('Unable to update profile at the moment. Try again later.');
    }
  };

  const onHealthSubmit = async (values: HealthMetricFormValues) => {
    setStatusMessage(null);
    setError(null);
    try {
      await healthMetricMutation.mutateAsync({
        hemoglobin: values.hemoglobin,
        bloodPressureSystolic: values.bloodPressureSystolic,
        bloodPressureDiastolic: values.bloodPressureDiastolic,
        pulse: values.pulse,
        weight: values.weight,
        notes: values.notes,
      });
      resetHealth();
      setStatusMessage('Health metric recorded.');
    } catch (err) {
      console.error(err);
      setError('Unable to record health metric.');
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Your profile</h1>
        <p className="text-sm text-slate-400">
          Keep your details accurate so coordinators and recipients can rely on you.
        </p>
      </header>

      {(statusMessage || error) && (
        <div
          className={clsx(
            'rounded-xl border px-4 py-3 text-sm',
            error
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          )}
        >
          {error ?? statusMessage}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-white">Contact details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="firstName">
              First name
            </label>
            <input
              id="firstName"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('firstName')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="lastName">
              Last name
            </label>
            <input
              id="lastName"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('lastName')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="phoneNumber">
              Phone number
            </label>
            <input
              id="phoneNumber"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('phoneNumber')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="bloodType">
              Blood type
            </label>
            <input
              id="bloodType"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('bloodType')}
            />
          </div>
          <fieldset className="md:col-span-2 space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <legend className="text-sm font-semibold text-slate-300">Notifications</legend>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" {...register('notificationPreferences.emergencyAlerts')} />
              Emergency alerts
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" {...register('notificationPreferences.emailUpdates')} />
              Email updates
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" {...register('notificationPreferences.smsUpdates')} />
              SMS updates
            </label>
          </fieldset>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/80 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {user?.role === 'donor' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white">Health log</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="px-4 py-3 font-medium">Recorded</th>
                    <th className="px-4 py-3 font-medium">Hemoglobin</th>
                    <th className="px-4 py-3 font-medium">BP</th>
                    <th className="px-4 py-3 font-medium">Pulse</th>
                    <th className="px-4 py-3 font-medium">Weight</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {healthMetricsQuery.isLoading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        Loading health history…
                      </td>
                    </tr>
                  )}
                  {!healthMetricsQuery.isLoading &&
                    healthMetricsQuery.data &&
                    healthMetricsQuery.data.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                          No health entries yet. Log your first metrics to unlock trends.
                        </td>
                      </tr>
                    )}
                  {healthMetrics.map((metric) => (
                    <tr key={metric.recordedAt}>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(metric.recordedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{metric.hemoglobin ?? '—'}</td>
                      <td className="px-4 py-3">
                        {metric.bloodPressureSystolic && metric.bloodPressureDiastolic
                          ? `${metric.bloodPressureSystolic}/${metric.bloodPressureDiastolic}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">{metric.pulse ?? '—'}</td>
                      <td className="px-4 py-3">{metric.weight ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{metric.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white">Log new metrics</h2>
            <form
              onSubmit={handleHealthSubmit(onHealthSubmit)}
              className="mt-4 grid gap-4 md:grid-cols-2"
            >
              <div>
                <label className="text-sm font-medium text-slate-300" htmlFor="hemoglobin">
                  Hemoglobin (g/dL)
                </label>
                <input
                  id="hemoglobin"
                  type="number"
                  step="0.1"
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  {...registerHealth('hemoglobin')}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300" htmlFor="pulse">
                  Pulse (bpm)
                </label>
                <input
                  id="pulse"
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  {...registerHealth('pulse')}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300" htmlFor="bloodPressureSystolic">
                  Blood pressure systolic
                </label>
                <input
                  id="bloodPressureSystolic"
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  {...registerHealth('bloodPressureSystolic')}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300" htmlFor="bloodPressureDiastolic">
                  Blood pressure diastolic
                </label>
                <input
                  id="bloodPressureDiastolic"
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  {...registerHealth('bloodPressureDiastolic')}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300" htmlFor="weight">
                  Weight (kg)
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  {...registerHealth('weight')}
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
                  {...registerHealth('notes')}
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingHealth || healthMetricMutation.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/80 disabled:opacity-50"
                >
                  {healthMetricMutation.isPending ? 'Logging…' : 'Save metrics'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
};

export default ProfilePage;
