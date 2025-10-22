import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  bloodType?: string;
}

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'donor', label: 'Donor' },
  { value: 'recipient', label: 'Recipient' },
  { value: 'delivery', label: 'Delivery Partner' },
  { value: 'admin', label: 'Administrator' },
];

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, otpHint } = useAuthStore((state) => ({
    register: state.register,
    otpHint: state.otpHint,
  }));
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      role: 'donor',
      bloodType: undefined,
    },
  });

  const selectedRole = watch('role');
  const shouldShowBloodType = useMemo(() => ['donor', 'recipient'].includes(selectedRole), [selectedRole]);

  const onSubmit = async (values: RegisterFormValues) => {
    setError(null);
    try {
      const otp = await registerUser(values);
      if (otp) {
        window.alert(`For demo use only: your verification code is ${otp}`);
      }
      navigate(`/auth/verify-otp?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      console.error(err);
      setError('Unable to create account. Please review your details and try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">Join the BloodStream network</h1>
          <p className="mt-2 text-sm text-slate-400">Create an account to donate, request, or manage blood deliveries.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="firstName">
              First name
            </label>
            <input
              id="firstName"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('firstName', { required: true })}
              placeholder="Alex"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="lastName">
              Last name
            </label>
            <input
              id="lastName"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('lastName', { required: true })}
              placeholder="Rivera"
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
              {...register('email', { required: true })}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="phoneNumber">
              Phone number
            </label>
            <input
              id="phoneNumber"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('phoneNumber', { required: true })}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('password', { required: true, minLength: 6 })}
              placeholder="Create a secure password"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              {...register('role', { required: true })}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {shouldShowBloodType && (
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="bloodType">
                Blood type
              </label>
              <select
                id="bloodType"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                {...register('bloodType', { required: shouldShowBloodType })}
              >
                <option value="">Select blood type</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            {error && <p className="text-sm text-red-400">{error}</p>}
            {otpHint && (
              <p className="text-sm text-emerald-300">
                A one-time passcode has been generated. Keep it handy for verification.
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/80 disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-semibold text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
