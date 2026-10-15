import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ url }) => (
  <Link to={url} className="link black" title="About Blips of Life 2"><h1 className="mb2">Blips of Life 2</h1></Link>
);

export default Header;
