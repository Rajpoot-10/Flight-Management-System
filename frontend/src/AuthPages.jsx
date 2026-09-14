import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Plane } from "lucide-react";
import { useAuth } from "./AuthContext";
import "./AuthPages.css";

function AuthShell({ eyebrow, title, description, children }) {
    return (
        <main className="auth-page">
            <div className="auth-panel">
                <Link className="auth-back" to="/">
                    <ArrowLeft size={16} /> Back to flights
                </Link>
                <div className="auth-brand"><span><Plane size={21} /></span> AeroFlow</div>
                <span className="auth-eyebrow">{eyebrow}</span>
                <h1>{title}</h1>
                <p className="auth-description">{description}</p>
                {children}
            </div>
        </main>
    );
}

function continueToIntendedLocation(navigate, from) {
    if (!from) {
        navigate("/", { replace: true });
        return;
    }

    if (typeof from === "string") {
        navigate(from, { replace: true });
        return;
    }

    navigate(
        { pathname: from.pathname, search: from.search, hash: from.hash },
        { replace: true, state: from.state }
    );
}

export function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signIn(form.email.trim(), form.password);
            continueToIntendedLocation(navigate, location.state?.from);
        } catch (err) {
            setError(err.message || "Unable to sign in.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell eyebrow="WELCOME BACK" title="Sign in to AeroFlow" description="Access your account and continue managing your journey.">
            <form className="auth-form" onSubmit={submit}>
                <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
                <label>Password<input required type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
                {error && <div className="auth-error">{error}</div>}
                <button className="auth-submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
            </form>
            <p className="auth-switch">New to AeroFlow? <Link to="/signup" state={{ from: location.state?.from }}>Create an account</Link></p>
        </AuthShell>
    );
}

export function Signup() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signUp } = useAuth();
    const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const data = await signUp(form.fullName.trim(), form.email.trim(), form.password);
            if (data.session) continueToIntendedLocation(navigate, location.state?.from);
            else setMessage("Account created. Please verify your email before signing in.");
        } catch (err) {
            setError(err.message || "Unable to create your account.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell eyebrow="JOIN AEROFLOW" title="Create your account" description="Save your passenger details and keep every trip within reach.">
            <form className="auth-form" onSubmit={submit}>
                <label>Full name<input required autoComplete="name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
                <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
                <label>Password<input required type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
                <label>Confirm password<input required type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></label>
                {error && <div className="auth-error">{error}</div>}
                {message && <div className="auth-success">{message}</div>}
                <button className="auth-submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
            </form>
            <p className="auth-switch">Already registered? <Link to="/login" state={{ from: location.state?.from }}>Sign in</Link></p>
        </AuthShell>
    );
}

export function AccessDenied() {
    return <AuthShell eyebrow="ACCESS RESTRICTED" title="This area is for administrators" description="Your passenger account does not have access to operations controls."><div className="auth-denied"><LockKeyhole size={30} /><Link className="auth-submit" to="/">Return to flights</Link></div></AuthShell>;
}
