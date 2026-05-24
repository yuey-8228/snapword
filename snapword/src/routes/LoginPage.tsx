import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';

export function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast('请填写邮箱和密码', 'error');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast('登录成功（演示）', 'success');
      navigate('/', { replace: true });
    }, 600);
  }

  return (
    <div className="min-h-full">
      <PageHeader showBack backTo="/" />
      <main className="max-w-[440px] mx-auto px-5 pt-12 md:pt-20 pb-16">
        <h1
          className="font-display text-center"
          style={{
            fontSize: 'clamp(28px, 4vw, 36px)',
            lineHeight: 1.15,
            letterSpacing: '-0.026em',
            fontWeight: 500,
            color: 'var(--charcoal-primary)',
          }}
        >
          欢迎回来
        </h1>
        <p
          className="mt-3 text-center"
          style={{ color: 'var(--graphite)', fontSize: 15, lineHeight: 1.5 }}
        >
          登录继续你的单词收藏之旅
        </p>

        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-4">
          <Field
            label="邮箱"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />
          <Field
            label="密码"
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            placeholder="至少 6 位"
            trailing={
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="text-[13px] font-medium px-2 py-1"
                style={{ color: 'var(--graphite)' }}
                aria-label={showPwd ? '隐藏密码' : '显示密码'}
              >
                {showPwd ? '隐藏' : '显示'}
              </button>
            }
          />

          <button
            type="submit"
            disabled={submitting}
            className="btn-candy mt-4"
            style={{ width: '100%', minHeight: 52, fontSize: 16 }}
          >
            {submitting ? '登录中…' : '登录'}
          </button>
        </form>

        <p
          className="mt-8 text-center text-[14px]"
          style={{ color: 'var(--graphite)' }}
        >
          还没有账号？{' '}
          <Link
            to="/register"
            className="font-medium"
            style={{ color: 'var(--pink-primary)' }}
          >
            去注册
          </Link>
        </p>
      </main>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  trailing,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="block mb-2 text-[13px] font-medium"
        style={{ color: 'var(--graphite)' }}
      >
        {label}
      </span>
      <div
        className="flex items-center"
        style={{
          background: 'var(--pill-cream)',
          borderRadius: 'var(--radius-pill)',
          padding: '0 18px',
          minHeight: 52,
        }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent outline-none text-[15px]"
          style={{ color: 'var(--charcoal-primary)', minHeight: 52 }}
        />
        {trailing}
      </div>
    </label>
  );
}
