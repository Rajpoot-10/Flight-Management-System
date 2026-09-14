import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function AuthLoading() {
    return <div className="auth-loading">Restoring your AeroFlow session...</div>;
}

export function AdminRoute({ children }) {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    if (loading) return <AuthLoading />;
    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
    if (role !== "admin") return <Navigate to="/" replace />;

    return children;
}

export function AuthenticatedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <AuthLoading />;
    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

    return children;
}
