import { useNavigate } from 'react-router-dom';
import './RoleTabs.css';

const ROLES = [
  { key: 'student', label: 'Student', loginPath: '/login', registerPath: '/register' },
  { key: 'lecturer', label: 'Lecturer', loginPath: '/lecturer-login', registerPath: '/register-lecturer' },
  { key: 'business', label: 'Business', loginPath: '/business-login', registerPath: '/register-business' },
  { key: 'admin', label: 'Admin', loginPath: '/admin-login', registerPath: null },
];

export default function RoleTabs({ active, mode = 'login' }) {
  const navigate = useNavigate();

  // Admin has no self-registration flow, so it's hidden in register mode
  const visibleRoles = ROLES.filter((role) => mode === 'login' || role.registerPath);

  function handleClick(role) {
    const path = mode === 'login' ? role.loginPath : role.registerPath;
    if (path && role.key !== active) navigate(path);
  }

  return (
    <div className="role-tabs" role="tablist" aria-label="Choose account type">
      {visibleRoles.map((role) => (
        <button
          key={role.key}
          type="button"
          role="tab"
          aria-selected={active === role.key}
          className={`role-tab ${active === role.key ? 'role-tab-active' : ''}`}
          onClick={() => handleClick(role)}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
}