import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  const { role } = useAuth();

  return (
    <nav className="navbar">
      <NavLink to="/">Home</NavLink>
      {role === 'setter' && <NavLink to="/paper-setter">Paper Setter</NavLink>}
      {role === 'getter' && <NavLink to="/paper-getter">Paper Getter</NavLink>}
      {role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
      {role === 'super' && <NavLink to="/super-user">Super User</NavLink>}
    </nav>
  );
};

export default Navbar;