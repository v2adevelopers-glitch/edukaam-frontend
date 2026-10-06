import React, { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DContext } from '../../context/DContext'
import { moduleOf } from '../../helper/access'

// Menu comes from authState.menu_access (returned by the menu API for the user's role)
const SideBar = () => {
  const { authState } = useContext(DContext);
  const location = useLocation();
  const menu = Array.isArray(authState?.menu_access) ? authState.menu_access : [];

  const exactMatch = menu.some((item) => item?.path === location.pathname);
  const isActive = (item) => {
    if (item?.path === location.pathname) return true;
    // e.g. /profile/edit has no menu entry of its own: highlight the entry of the same module
    return !exactMatch && moduleOf(item?.path) !== "" && moduleOf(item?.path) === moduleOf(location.pathname);
  };

  return (
    <aside id="sidebar" className="sidebar">
      <ul className="sidebar-nav" id="sidebar-nav">
        {menu.map((item) => (
          <React.Fragment key={item?.menu_id}>
            {item?.heading && <li className="nav-heading">{item.heading}</li>}
            <li className="nav-item">
              <Link to={item?.path} className={"nav-link" + (isActive(item) ? "" : " collapsed")}>
                <i className={"bi " + (item?.icon || "bi-circle")}></i>
                <span>{item?.title}</span>
              </Link>
            </li>
          </React.Fragment>
        ))}
      </ul>
    </aside>
  )
}

export default SideBar
