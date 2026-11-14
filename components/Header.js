import SignOutButton from "./SignOutButton";

export default function Header({ user, admin }) {
  return (
    <header className="top">
      <a className="brand" href="/"><img src="/logo.png" alt="" width="34" height="34" /><span>Romeo Hub</span></a>
      <div className="who">
        {admin && <a className="b g" href="/admin">Approvals</a>}
        {user?.image && <img className="av" src={user.image} alt="" width="32" height="32" referrerPolicy="no-referrer" />}
        <span className="nm">{user?.name || user?.email}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
