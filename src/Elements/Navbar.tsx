import '../style/Navbar.css'

import { NavLink } from 'react-router-dom';

import Title from './Title';

interface PropsNavbar {
  streakTitle: number;
}

export default function Navbar({streakTitle} : PropsNavbar) {
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Learn', href: '/learn/' },
    { name: 'About', href: '/about/' },
  ];

  return (
    <header>
      <Title streakTitle={streakTitle} />
      <nav>
        {navItems.map((item) => (
          <NavLink key={item.name} to={item.href} className={({ isActive }) => `navbar-item${isActive ? ' navbar-curr-page' : ''}`}>
            {item.name}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
