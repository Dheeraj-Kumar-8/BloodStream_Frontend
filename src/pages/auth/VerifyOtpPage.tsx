import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { sendOtp } from '../../services/auth';

interface VerifyFormValues {
  email: string;
  otp: string;
}

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyOtp, otpHint } = useAuthStore((state) => ({
    verifyOtp: state.verifyOtp,
    otpHint: state.otpHint,
  }));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const defaultEmail = searchParams.get('email') ?? '';

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<VerifyFormValues>({
    defaultValues: {
      email: defaultEmail,
      otp: '',
    },
  });

  const onSubmit = async (values: VerifyFormValues) => {
    setError(null);
    setInfo(null);
    try {
      await verifyOtp(values.email, values.otp);
      navigate('/dashboard/overview');
    } catch (err) {
      console.error(err);
      setError('Verification failed. Please double-check the passcode and try again.');
    }
  };

  const handleResend = async () => {
    const email = searchParams.get('email');
    if (!email) {
      setError('Please provide your email to resend the OTP.');
      return;
    }
    try {
      const response = await sendOtp({ email });
      const debugCode = response?.debugCode;
      if (debugCode) {
        useAuthStore.setState({ otpHint: debugCode });
        window.alert(`For demo use only: your new verification code is ${debugCode}`);
        setInfo('A fresh OTP has been generated. Use the code shown above to continue.');
      } else {
        setInfo('A fresh OTP has been sent. Check your inbox or SMS messages.');
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to resend OTP right now. Please try again shortly.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">Verify your one-time passcode</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter the OTP we sent to your email or phone to activate your account.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <label className="text-sm font-medium text-slate-300" htmlFor="otp">
              One-time passcode
            </label>
            <input
              id="otp"
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm uppercase tracking-widest focus:border-primary focus:outline-none"
              {...register('otp', { required: true, minLength: 4 })}
              placeholder="123456"
            />
          </div>
          {otpHint && (
            <p className="text-sm text-emerald-300">Hint: {otpHint}</p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {info && <p className="text-sm text-emerald-300">{info}</p>}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleResend}
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              Resend OTP
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/80 disabled:opacity-60"
            >
              {isSubmitting ? 'Verifying…' : 'Verify & continue'}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Wrong email?{' '}
          <Link to="/auth/register" className="font-semibold text-primary hover:text-primary/80">
            Start over
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
