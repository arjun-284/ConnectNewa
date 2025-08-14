import { useNavigate } from "react-router-dom";

function LogoutButton() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };
  return (
    <button
      className="text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 px-4 py-2 rounded"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
}

export default LogoutButton;
