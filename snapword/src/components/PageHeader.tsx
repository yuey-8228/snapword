import { useNavigate, Link, NavLink } from 'react-router-dom';

interface Props {
  showBack?: boolean;
  backTo?: string;
  title?: string;
  right?: React.ReactNode;
}

export function PageHeader({ showBack, backTo, title, right }: Props) {
  const navigate = useNavigate();
  const showNav = !showBack;

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'var(--warm-canvas)',
        boxShadow: 'rgba(0, 0, 0, 0.04) 0px 0px 0px 1px',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 h-16 flex items-center gap-3">
        {showBack ? (
          <button
            type="button"
            className="btn-ghost -ml-2"
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            aria-label="返回"
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="hidden sm:inline">返回</span>
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2.5 -ml-1" aria-label="SnapWord 首页">
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center w-7 h-7 text-white text-sm"
              style={{
                background: 'var(--pink-primary)',
                borderRadius: 8,
                fontFamily: "'Fraunces', serif",
                fontWeight: 600,
                letterSpacing: '-0.03em',
              }}
            >
              S
            </span>
            <span
              className="font-sans text-[15px]"
              style={{ color: 'var(--charcoal-primary)', fontWeight: 500, letterSpacing: '-0.012em' }}
            >
              SnapWord
            </span>
          </Link>
        )}
        {title && (
          <span
            className="font-sans text-sm md:text-[15px] ml-2 truncate"
            style={{ color: 'var(--graphite)', fontWeight: 500 }}
          >
            {title}
          </span>
        )}

        {showNav && (
          <nav className="hidden md:flex items-center gap-1 ml-8" aria-label="主导航">
            <NavLink to="/wordbook" className={({ isActive }) => navLinkClass(isActive)}>
              词卡本
            </NavLink>
            <NavLink to="/review" className={({ isActive }) => navLinkClass(isActive)}>
              复习
            </NavLink>
            <NavLink to="/favorites" className={({ isActive }) => navLinkClass(isActive)}>
              收藏
            </NavLink>
          </nav>
        )}

        <div className="flex-1" />

        {showNav && !right && (
          <button
            type="button"
            className="btn-candy"
            style={{ paddingLeft: 22, paddingRight: 22, minHeight: 40, fontSize: 14 }}
            onClick={() => navigate('/login')}
          >
            登录
          </button>
        )}
        {right}
      </div>
    </header>
  );
}

function navLinkClass(isActive: boolean) {
  return [
    'px-3 py-2 rounded-full text-[14px] font-medium transition-colors',
    isActive
      ? 'text-[color:var(--midnight)] bg-[color:var(--stone-surface)]'
      : 'text-[color:var(--graphite)] hover:text-[color:var(--midnight)] hover:bg-[color:var(--stone-surface)]',
  ].join(' ');
}
