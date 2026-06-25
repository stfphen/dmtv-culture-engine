import Nav from "./Nav.jsx";
export default function CultureLayout({ children }) {
  return (<><Nav /><main className="wrap">{children}</main></>);
}
